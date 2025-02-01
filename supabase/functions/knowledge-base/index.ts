import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { generateArticleEmbeddings, searchArticlesByEmbeddings } from './embeddings.ts'

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
  newTags?: Array<{
    name: string
    slug: string
    color: string
  }>
}

const generateUniqueSlug = (baseSlug: string) => {
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};

const deleteUnusedTags = async (supabase: any) => {
  console.log('Starting deleteUnusedTags function...');

  // First get all existing tags to compare
  const { data: allTags, error: allTagsError } = await supabase
    .from('kb_tags')
    .select('*');

  console.log('All existing tags:', allTags);

  // Get all tag relationships
  const { data: allRelationships, error: relError } = await supabase
    .from('kb_article_tags')
    .select('*');

  console.log('All tag relationships:', allRelationships);

  // First get the used tag IDs
  const { data: usedTags, error: usedError } = await supabase
    .from('kb_article_tags')
    .select('tag_id')
    .not('tag_id', 'is', null);

  console.log('Used tags:', usedTags);

  if (usedError) {
    console.log('Error getting used tags:', usedError);
    return;
  }

  const usedTagIds = usedTags?.map(t => t.tag_id) || [];
  console.log('Used tag IDs:', usedTagIds);

  // Then get tags that aren't in the used tags list
  let unusedTagsQuery = supabase
    .from('kb_tags')
    .select('*');

  // Only apply the NOT IN filter if there are used tags
  if (usedTagIds.length > 0) {
    unusedTagsQuery = unusedTagsQuery.not('id', 'in', `(${usedTagIds.join(',')})`);
  }

  const { data: unusedTags, error } = await unusedTagsQuery;

  console.log('Query for unused tags completed');
  console.log('Error if any:', error);
  console.log('Unused tags found:', unusedTags);

  if (error) {
    console.log('Error checking for unused tags:', error);
    console.log('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    return;
  }

  if (unusedTags && unusedTags.length > 0) {
    console.log('Found unused tags:', {
      count: unusedTags.length,
      tags: unusedTags
    });

    const tagsToDelete = unusedTags.map(tag => tag.id);
    console.log('Attempting to delete tag IDs:', tagsToDelete);

    const { data: deletedData, error: deleteError } = await supabase
      .from('kb_tags')
      .delete()
      .in('id', tagsToDelete)
      .select();

    if (deleteError) {
      console.log('Error deleting unused tags:', deleteError);
      console.log('Delete error details:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint
      });
    } else {
      console.log('Successfully deleted tags:', {
        deletedCount: deletedData?.length || 0,
        deletedTags: deletedData
      });
  }
  } else {
    console.log('No unused tags found to delete');
  }

  // Verify the deletion by checking remaining tags
  const { data: remainingTags } = await supabase
    .from('kb_tags')
    .select('*');

  console.log('Remaining tags after operation:', remainingTags);
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

    let user: { id: string } | null = null;
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader);
    
    // Only try to authenticate if there's an auth header
    if (authHeader) {
      const authResult = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (authResult.data.user) {
        user = authResult.data.user;
      }
      console.log('User auth result:', {
        success: !!user,
        userId: user?.id
      });
    }

    const body = await req.json()
    console.log('Request body:', body);
    
    const { method = req.method, path = '', params = {} } = body
    console.log('Parsed request:', { method, path, params });
    
    const [resource, id] = path.split('/')
    console.log('Route parts:', { resource, id });

    // For write operations, verify user is an agent
    if (method !== 'GET') {
      if (!user) {
        console.log('No authenticated user for write operation');
        throw new Error('Authentication required for write operations');
      }

      console.log('Checking agent status for user:', user.id);
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', user.id)
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
              const query = supabase
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
                .eq('id', id);
              
              // Only show published articles to unauthenticated users
              if (!user) {
                query.eq('status', 'published');
              }

              const { data, error } = await query.single();

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
                `);

              // Only show published articles to unauthenticated users
              if (!user) {
                query = query.eq('status', 'published');
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

            // Extract tags and newTags before inserting article
            const { tags, newTags, ...articleData } = article;
            
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

            // Start processing embeddings asynchronously in the background
            console.log('Starting background embeddings generation for article:', createdArticle.id);
            generateArticleEmbeddings(supabase, createdArticle.id);

            // Create new tags if any
            let allTagIds = tags || [];
            if (newTags && newTags.length > 0) {
              console.log('Creating new tags:', newTags);
              const { data: createdTags, error: newTagsError } = await supabase
                .from('kb_tags')
                .insert(newTags)
                .select('id');

              if (newTagsError) {
                console.log('Error creating new tags:', newTagsError);
                throw newTagsError;
              }

              allTagIds = [...allTagIds, ...createdTags.map(tag => tag.id)];
            }

            // If there are tags, create the relationships
            if (allTagIds.length > 0) {
              console.log('Creating tag relationships for article:', createdArticle.id);
              const { error: tagsError } = await supabase
                .from('kb_article_tags')
                .insert(
                  allTagIds.map(tagId => ({
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
              const { tagIds, newTags } = body.body
              
              // Create new tags if any
              let allTagIds = tagIds || [];
              if (newTags && newTags.length > 0) {
                console.log('Creating new tags:', newTags);
                const { data: createdTags, error: newTagsError } = await supabase
                  .from('kb_tags')
                  .insert(newTags)
                  .select('id');

                if (newTagsError) {
                  console.log('Error creating new tags:', newTagsError);
                  throw newTagsError;
                }

                allTagIds = [...allTagIds, ...createdTags.map(tag => tag.id)];
              }
              
              // First delete existing tags
              await supabase
                .from('kb_article_tags')
                .delete()
                .eq('article_id', id)
              
              // Then insert new tags
              if (allTagIds.length > 0) {
                await supabase
                  .from('kb_article_tags')
                  .insert(
                    allTagIds.map(tagId => ({
                      article_id: id,
                      tag_id: tagId
                    }))
                  )
              }

              // Check and delete any tags that are no longer used
              await deleteUnusedTags(supabase);
              
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

              // Remove unnecessary embeddings check since we're only updating tags
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

            // Only process embeddings if content, title, or description were actually updated
            const hasContentChanges = 'content' in article || 'title' in article || 'description' in article
            if (hasContentChanges) {
              console.log('Starting background embeddings generation for updated article:', id);
              generateArticleEmbeddings(supabase, id);
            }

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

            // Clean up any tags that are no longer used
            await deleteUnusedTags(supabase);

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

      case 'search': {
        switch (method) {
          case 'POST': {
            const { query, limit = 10, similarityThreshold = 0.5 } = body.body;
            
            if (!query) {
              throw new Error('Search query is required');
            }

            const results = await searchArticlesByEmbeddings(
              supabase,
              query,
              limit,
              similarityThreshold
            );

            return new Response(JSON.stringify(results), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
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