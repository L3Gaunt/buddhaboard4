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
}

// Generate embeddings for an article
export async function generateArticleEmbeddings(
  supabase: SupabaseClient,
  articleId: string
) {
  // Create a background task for embeddings generation
  const backgroundTask = async () => {
    console.log('Starting embeddings generation for article:', articleId);

    try {
      // Fetch article data
      const { data: article, error: fetchError } = await supabase
        .from('kb_articles')
        .select('id, title, description, content')
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
          is_metadata_embedding_in_progress: true,
          is_content_embedding_in_progress: true
        })
        .eq('id', articleId)

      if (updateError) {
        console.error('Error marking article for processing:', {
          error: updateError,
          articleId
        });
        return false;
      }

      // Prepare metadata string
      const metadata = `${article.title || ''}\n${article.description || ''}`

      try {
        // Generate embeddings for metadata and content in parallel
        const [metadataEmbedding, contentEmbedding] = await Promise.all([
          openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: metadata,
            encoding_format: 'float'
          }),
          openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: article.content,
            encoding_format: 'float'
          })
        ]);

        // Update article with new embeddings
        const { error: saveError } = await supabase
          .from('kb_articles')
          .update({
            metadata_embedding: metadataEmbedding.data[0].embedding,
            content_embedding: contentEmbedding.data[0].embedding,
            is_metadata_embedding_in_progress: false,
            is_content_embedding_in_progress: false
          })
          .eq('id', articleId)

        if (saveError) {
          throw saveError;
        }

        console.log('Successfully generated and saved embeddings:', {
          articleId,
          metadataLength: metadata.length,
          contentLength: article.content.length
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

      // Reset processing flags
      await supabase
        .from('kb_articles')
        .update({
          is_metadata_embedding_in_progress: false,
          is_content_embedding_in_progress: false
        })
        .eq('id', articleId)
        .catch(resetError => console.error('Error resetting processing flags:', resetError));

      return false;
    }
  };

  // Register the background task
  EdgeRuntime.waitUntil(backgroundTask());

  // Add beforeunload event listener to handle shutdown
  addEventListener('beforeunload', async (ev: DenoBeforeUnloadEvent) => {
    console.log('Function will be shutdown due to', ev.detail?.reason);
    
    // Reset processing flags if shutdown occurs
    await supabase
      .from('kb_articles')
      .update({
        is_metadata_embedding_in_progress: false,
        is_content_embedding_in_progress: false
      })
      .eq('id', articleId)
      .catch(resetError => console.error('Error resetting processing flags on shutdown:', resetError));
  });

  // Return immediately while processing continues in background
  return true;
} 
