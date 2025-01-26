import { useState, useEffect } from 'react';
import { Search, X, Plus, Filter } from 'lucide-react';
import { getArticles, getTags, getArticle, updateArticle, updateArticleTags, deleteArticle, createArticle } from '../../services/knowledge-base';
import { getCurrentUser, getAgentProfile } from '../../lib/auth';
import type { KBArticle, KBTag } from '../../types/knowledge-base';
import { ArticleView } from '../../components/ArticleView';

// Helper function to generate a slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

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

// Helper function to get filters from URL parameters and localStorage
const getFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const storedFilters = localStorage.getItem('kbFilters');
  const parsedStoredFilters = storedFilters ? JSON.parse(storedFilters) : null;

  return {
    tags: params.get('tags')?.split(',').filter(Boolean) || 
          parsedStoredFilters?.tags || [],
    filterMode: (params.get('filterMode') || parsedStoredFilters?.filterMode || 'AND') as 'AND' | 'OR',
    searchQuery: params.get('search') || 
                parsedStoredFilters?.searchQuery || '',
  };
};

// Helper function to update URL parameters and localStorage with current filters
const updateURLWithFilters = (tags: string[], filterMode: 'AND' | 'OR', searchQuery: string) => {
  const params = new URLSearchParams();
  if (tags.length) params.set('tags', tags.join(','));
  if (filterMode !== 'AND') params.set('filterMode', filterMode);
  if (searchQuery) params.set('search', searchQuery);
  
  const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.pushState({}, '', newURL);

  // Store in localStorage
  localStorage.setItem('kbFilters', JSON.stringify({
    tags,
    filterMode,
    searchQuery
  }));
};

export function KnowledgeBaseView() {
  // Get stored filters and search query
  const savedFilters = getFiltersFromURL();
  const [selectedTags, setSelectedTags] = useState<string[]>(savedFilters.tags);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>(savedFilters.filterMode);
  const [searchQuery, setSearchQuery] = useState(savedFilters.searchQuery);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [currentArticle, setCurrentArticle] = useState<KBArticle | null>(null);
  const [tags, setTags] = useState<KBTag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAgent, setIsAgent] = useState(false);
  const [isCreatingArticle, setIsCreatingArticle] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
      loadArticle(articleId);
    } else {
      loadData(currentPage);
    }

    // Check if user is an agent
    getCurrentUser().then(async (user) => {
      if (user) {
        const agentProfile = await getAgentProfile(user.id);
        setIsAgent(!!agentProfile);
      }
    });

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

  // Update URL and localStorage when filters change
  useEffect(() => {
    updateURLWithFilters(selectedTags, filterMode, searchQuery);
  }, [selectedTags, filterMode, searchQuery]);

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
      // Filter by status - only show published articles to non-agents
      if (!isAgent && article.status !== 'published') {
        return false;
      }
      
      // First filter by tags if any are selected
      const matchesTags = selectedTags.length === 0 || (
        filterMode === 'AND' 
          ? selectedTags.every((tagId) => 
              article.kb_article_tags?.some(at => at.kb_tags.id === tagId)
            )
          : selectedTags.some((tagId) => 
              article.kb_article_tags?.some(at => at.kb_tags.id === tagId)
            )
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
    setIsCreatingArticle(false);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleArticleSave = async (updatedArticle: Partial<KBArticle> & { newTags?: Array<{ name: string; slug: string; color: string; }> }) => {
    try {
      setIsLoading(true);
      
      // Update article content
      await updateArticle(updatedArticle.id!, {
        title: updatedArticle.title!,
        description: updatedArticle.description,
        content: updatedArticle.content!,
        status: updatedArticle.status || 'published'
      });

      // Update tags if they were changed
      if (updatedArticle.kb_article_tags) {
        const tagIds = updatedArticle.kb_article_tags.map(tag => tag.kb_tags.id);
        await updateArticleTags(updatedArticle.id!, tagIds, updatedArticle.newTags);
      }
      
      // Refresh the article
      if (currentArticle) {
        const article = await getArticle(currentArticle.id);
        setCurrentArticle(article);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleDelete = async () => {
    if (!currentArticle) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the article "${currentArticle.title}"? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      await deleteArticle(currentArticle.id);
      handleBack(); // Go back to article list after deletion
      loadData(currentPage); // Reload the articles list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateArticle = () => {
    const title = 'New Article';
    const newArticle: KBArticle = {
      id: '',
      title,
      content: '',
      description: '',
      status: 'draft',
      slug: generateSlug(title),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      kb_article_tags: []
    };
    setIsCreatingArticle(true);
    setCurrentArticle(newArticle);
  };

  const handleNewArticleSave = async (article: Partial<KBArticle> & { newTags?: Array<{ name: string; slug: string; color: string; }> }) => {
    try {
      const { id, created_at, updated_at, newTags, kb_article_tags, ...articleData } = article as KBArticle & { newTags?: Array<{ name: string; slug: string; color: string; }> };
      const createArticleInput = {
        ...articleData,
        status: articleData.status === 'archived' ? 'draft' : articleData.status || 'draft',
        slug: generateSlug(articleData.title),
        newTags,
        tags: kb_article_tags?.map(tag => tag.kb_tags.id)
      };
      const createdArticle = await createArticle(createArticleInput);
      setCurrentArticle(createdArticle);
      setIsCreatingArticle(false);
      await loadData(currentPage);
    } catch (err) {
      setError('Failed to create article');
      console.error(err);
    }
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

  if (currentArticle || isCreatingArticle) {
    return (
      <ArticleView
        article={currentArticle as KBArticle}
        onBack={handleBack}
        onSave={isCreatingArticle ? handleNewArticleSave : handleArticleSave}
        onDelete={!isCreatingArticle ? handleArticleDelete : undefined}
        canEdit={isAgent}
        isCreating={isCreatingArticle}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
        {isAgent && (
          <button
            onClick={handleCreateArticle}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Article
          </button>
        )}
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Knowledge Base</h2>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setFilterMode(mode => mode === 'AND' ? 'OR' : 'AND')}
              className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <Filter className="h-4 w-4" />
              {filterMode === 'AND' ? 'Match all tags' : 'Match any tag'}
            </button>
          )}
        </div>
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
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{article.title}</h3>
              {article.status === 'draft' && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Draft
                </span>
              )}
            </div>
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
