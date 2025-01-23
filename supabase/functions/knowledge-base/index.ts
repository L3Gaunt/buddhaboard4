import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Article {
  id?: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'published'
}

serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    console.log('Supabase client created with URL:', supabaseUrl);

    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header found');
      throw new Error('Unauthorized - No auth header');
    }

    const user = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    console.log('User auth result:', {
      success: !!user.data.user,
      userId: user.data.user?.id,
      error: user.error
    });
    
    if (!user.data.user) {
      console.log('No user found in auth response');
      throw new Error('Unauthorized - Invalid token');
    }

    const body = await req.json()
    console.log('Request body:', body);
    
    const { method = req.method, path = '', params = {} } = body
    console.log('Parsed request:', { method, path, params });
    
    const [resource, id] = path.split('/')
    console.log('Route parts:', { resource, id });

    // For write operations, verify user is an agent
    if (method !== 'GET') {
      console.log('Checking agent status for user:', user.data.user.id);
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single()

      if (agentError) {
        console.log('Error checking agent status:', agentError);
      }

      if (!agent) {
        console.log('User is not an agent');
        throw new Error('Only agents can modify articles')
      }
      console.log('User is confirmed as agent:', agent.id);
    }

    switch (resource) {
      case 'articles': {
        switch (method) {
          case 'GET': {
            if (id) {
              console.log('Fetching single article:', id);
              // Get single article
              const { data, error } = await supabase
                .from('kb_articles')
                .select(`
                  id,
                  title,
                  slug,
                  content,
                  status,
                  created_at,
                  updated_at,
                  kb_article_tags (
                    kb_tags (
                      id,
                      name,
                      slug,
                      color
                    )
                  )
                `)
                .eq('id', id)
                .single()

              if (error) {
                console.log('Error fetching article:', error);
                throw error;
              }
              console.log('Article fetched successfully:', { id: data.id, title: data.title });
              return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              })
            } else {
              // List articles with pagination
              console.log('Fetching articles list with params:', params);
              const { page = 1, limit = 10 } = params
              const offset = (page - 1) * limit

              const { data, error, count } = await supabase
                .from('kb_articles')
                .select(`
                  id,
                  title,
                  slug,
                  content,
                  status,
                  created_at,
                  updated_at,
                  kb_article_tags (
                    kb_tags (
                      id,
                      name,
                      slug,
                      color
                    )
                  )
                `, { count: 'exact' })
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)

              if (error) {
                console.log('Error fetching articles:', error);
                throw error;
              }
              
              console.log('Articles fetched successfully:', {
                count,
                pageSize: limit,
                currentPage: page,
                numArticles: data?.length
              });

              const response = {
                data,
                pagination: {
                  total: count || 0,
                  total_pages: Math.ceil((count || 0) / limit),
                  page: page,
                  page_size: limit
                }
              };

              return new Response(JSON.stringify(response), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              })
            }
          }

          case 'POST': {
            // Create article
            const article: Article = body.body
            const { data, error } = await supabase
              .from('kb_articles')
              .insert([article])
              .select()

            if (error) throw error
            return new Response(JSON.stringify(data[0]), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 201,
            })
          }

          case 'PUT': {
            if (!id) throw new Error('Article ID is required')
            const article: Partial<Article> = body.body
            const { data, error } = await supabase
              .from('kb_articles')
              .update(article)
              .eq('id', id)
              .select()

            if (error) throw error
            return new Response(JSON.stringify(data[0]), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }

          case 'DELETE': {
            if (!id) throw new Error('Article ID is required')
            const { error } = await supabase
              .from('kb_articles')
              .delete()
              .eq('id', id)

            if (error) throw error
            return new Response(null, {
              headers: corsHeaders,
              status: 204,
            })
          }
        }
      }

      case 'tags': {
        if (method === 'GET') {
          const { data, error } = await supabase
            .from('kb_tags')
            .select('id, name, slug')
            .order('name')

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      }
    }

    return new Response('Not found', {
      headers: corsHeaders,
      status: 404,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message === 'Unauthorized' ? 401 : 400,
    })
  }
}) 