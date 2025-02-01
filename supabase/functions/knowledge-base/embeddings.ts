import { OpenAI } from 'https://esm.sh/openai@4.28.0'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Declare EdgeRuntime type
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<any>) => void;
};

// Extend BeforeUnloadEvent for Deno
interface DenoBeforeUnloadEvent extends BeforeUnloadEvent {
  detail?: {
    reason: string;
  };
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

interface Article {
  id: string
  title?: string
  description?: string
  content: string
  similarity?: number
}

// Generate embeddings for an article's metadata
export async function generateArticleEmbeddings(
  supabase: SupabaseClient,
  articleId: string
) {
  // Create a background task for embeddings generation
  const backgroundTask = async () => {
    console.log('Starting metadata embeddings generation for article:', articleId);

    try {
      // Fetch article data
      const { data: article, error: fetchError } = await supabase
        .from('kb_articles')
        .select('id, title, description')
        .eq('id', articleId)
        .single()

      if (fetchError || !article) {
        console.error('Error fetching article:', {
          error: fetchError,
          articleId
        });
        return false;
      }

      // Mark article as processing
      const { error: updateError } = await supabase
        .from('kb_articles')
        .update({
          is_metadata_embedding_in_progress: true
        })
        .eq('id', articleId)

      if (updateError) {
        console.error('Error marking article for processing:', {
          error: updateError,
          articleId
        });
        return false;
      }

      try {
        // Prepare metadata string
        const metadata = `${article.title || ''}\n${article.description || ''}`

        // Generate embedding for metadata
        const metadataEmbedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: metadata,
          encoding_format: 'float'
        });

        // Update article with new embedding
        const { error: saveError } = await supabase
          .from('kb_articles')
          .update({
            metadata_embedding: metadataEmbedding.data[0].embedding,
            is_metadata_embedding_in_progress: false
          })
          .eq('id', articleId)

        if (saveError) {
          throw saveError;
        }

        console.log('Successfully generated and saved metadata embedding:', {
          articleId,
          metadataLength: metadata.length
        });

        return true;

      } catch (error) {
        console.error('Error in embeddings generation:', {
          error,
          articleId,
          errorMessage: error.message
        });
        throw error;
      }

    } catch (error) {
      console.error('Error in embeddings process:', {
        error,
        articleId,
        errorMessage: error.message
      });

      // Reset processing flag
      await supabase
        .from('kb_articles')
        .update({
          is_metadata_embedding_in_progress: false
        })
        .eq('id', articleId)
        .catch(resetError => console.error('Error resetting processing flag:', resetError));

      return false;
    }
  };

  // Register the background task
  EdgeRuntime.waitUntil(backgroundTask());

  // Add beforeunload event listener to handle shutdown
  addEventListener('beforeunload', async (ev: DenoBeforeUnloadEvent) => {
    console.log('Function will be shutdown due to', ev.detail?.reason);
    
    // Reset processing flag if shutdown occurs
    await supabase
      .from('kb_articles')
      .update({
        is_metadata_embedding_in_progress: false
      })
      .eq('id', articleId)
      .catch(resetError => console.error('Error resetting processing flag on shutdown:', resetError));
  });

  // Return immediately while processing continues in background
  return true;
}

// Search articles using metadata embeddings
export async function searchArticlesByEmbeddings(
  supabase: SupabaseClient,
  searchText: string,
  limit: number = 10,
  similarityThreshold: number = 0
): Promise<Article[]> {
  console.log('Starting article search with parameters:', {
    searchText,
    limit,
    similarityThreshold
  });

  try {
    // Generate embedding for search text
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: searchText,
      encoding_format: 'float'
    });

    // Search using the simplified SQL function
    const dbParams = {
      query_embedding: embedding.data[0].embedding,
      match_count: limit,
      similarity_threshold: similarityThreshold
    };
    console.log('Calling search_kb_articles with parameters:', {
      query_embedding: embedding.data[0].embedding,
      similarity_threshold: similarityThreshold,
      match_count: limit,
    });

    const { data: searchResults, error } = await supabase
      .rpc('search_kb_articles', dbParams);

    console.log('Search results:', searchResults);

    if (error) {
      console.error('Database search failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('Search completed successfully:', {
      resultsCount: searchResults?.length || 0,
      results: searchResults?.map(r => ({
        id: r.id,
        title: r.title,
        similarity: r.similarity
      }))
    });

    return searchResults || [];
  } catch (error) {
    console.error('Fatal error in searchArticlesByEmbeddings:', {
      error: error.message,
      stack: error.stack,
      searchText,
      limit,
      similarityThreshold
    });
    throw error;
  }
} 
