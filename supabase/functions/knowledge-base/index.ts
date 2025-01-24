import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Article {
  id?: string
  title: string
  description?: string
  slug: string
  content: string
  status: 'draft' | 'published'
  tags?: string[] // Array of tag IDs
}

const generateUniqueSlug = (baseSlug: string) => {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};

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
        .eq('id', user.data.user.id)
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
                  description,
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

              // Check if user is an agent
              const { data: agent } = await supabase
                .from('agents')
                .select('id')
                .eq('id', user.data.user.id)
                .single()

              let query = supabase
                .from('kb_articles')
                .select(`
                  id,
                  title,
                  description,
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
                
              // Only filter by published status for non-agents
              if (!agent) {
                query = query.eq('status', 'published')
              }

              const { data, error, count } = await query
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
            console.log('Starting article creation with body:', body);
            const article: Article = body.body;
            console.log('Parsed article data:', article);

            // Validate required fields
            if (!article.title || !article.content || !article.slug) {
              console.log('Validation failed - missing required fields');
              throw new Error('Title, content and slug are required');
            }

            // Extract tags before inserting article
            const { tags, ...articleData } = article;
            
            // Generate unique slug
            const uniqueSlug = generateUniqueSlug(articleData.slug);
            console.log('Generated unique slug:', uniqueSlug);
            
            console.log('Attempting to insert article into kb_articles table');
            const { data: createdArticle, error: articleError } = await supabase
              .from('kb_articles')
              .insert([{
                title: articleData.title,
                description: articleData.description,
                slug: uniqueSlug,
                content: articleData.content,
                status: articleData.status || 'draft'
              }])
              .select('id, title, description, slug, content, status, created_at, updated_at')
              .single();

            if (articleError) {
              console.log('Error inserting article:', articleError);
              throw articleError;
            }

            // If there are tags, create the relationships
            if (tags && tags.length > 0) {
              console.log('Creating tag relationships for article:', createdArticle.id);
              const { error: tagsError } = await supabase
                .from('kb_article_tags')
                .insert(
                  tags.map(tagId => ({
                    article_id: createdArticle.id,
                    tag_id: tagId
                  }))
                );

              if (tagsError) {
                console.log('Error creating tag relationships:', tagsError);
                // Don't throw here, we'll return the article anyway
              }
            }

            console.log('Article created successfully:', createdArticle);
            return new Response(JSON.stringify(createdArticle), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 201,
            });
          }

          case 'PUT': {
            if (!id) throw new Error('Article ID is required')
            
            // Handle tag updates
            if (path.endsWith('/tags')) {
              const { tagIds } = body.body
              
              // First delete existing tags
              await supabase
                .from('kb_article_tags')
                .delete()
                .eq('article_id', id)
              
              // Then insert new tags
              if (tagIds.length > 0) {
                await supabase
                  .from('kb_article_tags')
                  .insert(
                    tagIds.map(tagId => ({
                      article_id: id,
                      tag_id: tagId
                    }))
                  )
              }
              
              // Return updated article
              const { data, error } = await supabase
                .from('kb_articles')
                .select(`
                  id,
                  title,
                  description,
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

              if (error) throw error
              return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              })
            }
            
            // Handle regular article updates
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
        switch (method) {
          case 'GET': {
            const { data, error } = await supabase
              .from('kb_tags')
              .select('id, name, slug, color')
              .order('name')

            if (error) throw error
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            })
          }

          case 'POST': {
            console.log('Creating new tag');
            const { name, color } = body;
            if (!name) {
              throw new Error('Tag name is required');
            }
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            const { data, error } = await supabase
              .from('kb_tags')
              .insert({ name, slug, color })
              .single();
            if (error) {
              console.log('Error inserting tag:', error);
              throw new Error('Failed to create tag');
            }
            console.log('Tag created:', data);
            return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
          }
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