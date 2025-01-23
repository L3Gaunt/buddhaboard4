import type { KBArticle } from '../types/knowledge-base';
import { getTagStyles } from '../views/KnowledgeBaseView';

interface ArticleViewProps {
  article: KBArticle;
  onBack?: () => void;
}

export function ArticleView({ article, onBack }: ArticleViewProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <div className="mb-8">
        {onBack && (
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Articles
          </button>
        )}
        <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>
        {article.description && (
          <p className="text-gray-600 mb-4">{article.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {article.kb_article_tags?.map((tag) => (
            <span
              key={tag.kb_tags.id}
              style={getTagStyles(tag.kb_tags.color)}
              className="px-3 py-1 rounded-full text-sm font-medium"
            >
              {tag.kb_tags.name}
            </span>
          ))}
        </div>
      </div>
      
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
      
      <div className="mt-8 text-sm text-gray-500 border-t pt-4">
        <p>Last updated: {new Date(article.updated_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
} 