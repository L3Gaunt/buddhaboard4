import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { getArticles, getTags, getArticle } from '../../services/knowledge-base';
import type { KBArticle, KBTag } from '../../types/knowledge-base';
import { ArticleView } from '../../components/ArticleView';

// Helper function to generate tag styles based on color
export const getTagStyles = (color: string | null, isSelected: boolean = false) => {
  if (!color) return {};
  
  // Convert hex to RGB for background opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    backgroundColor: isSelected ? color : `rgba(${r}, ${g}, ${b}, 0.1)`,
    color: isSelected ? 'white' : color,
    borderColor: color,
    border: '1px solid'
  };
};

export function KnowledgeBaseView() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [currentArticle, setCurrentArticle] = useState<KBArticle | null>(null);
  const [tags, setTags] = useState<KBTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
      loadArticle(articleId);
    } else {
      loadData(currentPage);
    }

    // Listen for browser back/forward navigation
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('article');
      if (articleId) {
        loadArticle(articleId);
      } else {
        setCurrentArticle(null);
        loadData(currentPage);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  async function loadArticle(id: string) {
    try {
      setIsLoading(true);
      const article = await getArticle(id);
      setCurrentArticle(article);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadData(page: number) {
    try {
      setIsLoading(true);
      const [articlesResponse, tagsData] = await Promise.all([
        getArticles(page, 10),
        getTags()
      ]);
      
      if (articlesResponse && tagsData) {
        setArticles(articlesResponse.data);
        setTotalPages(articlesResponse.pagination.total_pages);
        setTags(tagsData);
      } else {
        throw new Error('Failed to load data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredArticles = articles
    .filter((article) => {
      // First filter by tags if any are selected
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every((tagId) => 
          article.kb_article_tags?.some(at => at.kb_tags.id === tagId)
        );
      
      // Then filter by search query if one exists
      const matchesSearch = !searchQuery || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      return matchesTags && matchesSearch;
    });

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleArticleClick = (article: KBArticle) => {
    const newUrl = `${window.location.pathname}?article=${article.id}`;
    window.history.pushState({}, '', newUrl);
    setCurrentArticle(article);
  };

  const handleBack = () => {
    const newUrl = window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setCurrentArticle(null);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (currentArticle) {
    return (
      <div className="flex-1 p-8">
        <ArticleView article={currentArticle} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Knowledge Base</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              style={getTagStyles(tag.color, selectedTags.includes(tag.id))}
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors
                ${selectedTags.includes(tag.id) ? '' : 'hover:bg-opacity-20'}`}
            >
              {tag.name}
              {selectedTags.includes(tag.id) && <X className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => (
          <button
            key={article.id}
            onClick={() => handleArticleClick(article)}
            className="text-left block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{article.title}</h3>
            {article.description && (
              <p className="text-gray-600 mb-4 line-clamp-2">{article.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {article.kb_article_tags?.map((tag) => (
                <span
                  key={tag.kb_tags.id}
                  style={getTagStyles(tag.kb_tags.color)}
                  className="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {tag.kb_tags.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
