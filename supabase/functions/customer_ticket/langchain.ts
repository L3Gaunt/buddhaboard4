import { OpenAI } from 'https://esm.sh/openai@4.28.0'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { searchArticlesByEmbeddings } from '../knowledge-base/embeddings.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

interface AgentResponse {
  message: string;
  relevantArticles: Array<{
    id: string;
    title: string;
    content: string;
    similarity: number;
  }>;
}

export async function generateAgentResponse(
  supabase: SupabaseClient,
  ticketTitle: string,
  ticketMessage: string,
  similarityThreshold = 0.,
  maxArticles = 3
): Promise<AgentResponse> {
  // First search knowledge base using the ticket title and message
  const searchQuery = `${ticketTitle}\n${ticketMessage}`;
  const relevantArticles = await searchArticlesByEmbeddings(
    supabase,
    searchQuery,
    maxArticles,
    similarityThreshold
  );

  // If no relevant articles found, return a default response
  if (!relevantArticles || relevantArticles.length === 0) {
    return {
      message: "Thank you for your message. I'll look into this and get back to you as soon as possible.",
      relevantArticles: []
    };
  }

  // Format articles for the prompt
  const articlesContext = relevantArticles
    .map((article, index) => `Article ${index + 1}:
Title: ${article.title}
Content: ${article.content}
`)
    .join('\n\n');

  // Generate response using OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a helpful customer service agent. Using the provided knowledge base articles, 
        generate a helpful response to the customer's ticket. If the articles don't fully address their issue,
        acknowledge this and assure them an agent will follow up. Be concise but friendly.`
      },
      {
        role: "user",
        content: `Customer Ticket:
Title: ${ticketTitle}
Message: ${ticketMessage}

Knowledge Base Articles:
${articlesContext}

Generate a helpful response to the customer.`
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  const agentMessage = response.choices[0]?.message?.content || 
    "Thank you for your message. I'll look into this and get back to you as soon as possible.";

  return {
    message: agentMessage,
    relevantArticles
  };
} 