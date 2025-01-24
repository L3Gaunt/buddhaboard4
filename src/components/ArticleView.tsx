import { useState, useRef } from 'react';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';
import type { KBArticle } from '../types/knowledge-base';
import { getTagStyles } from '../views/KnowledgeBaseView';
import { ArticleEditor, ArticleEditorRef } from './ArticleEditor';
import { TagSelector, CollapsedTagSelector } from './TagSelectorInArticleEditor';

interface ArticleViewProps {
  article: KBArticle;
  onBack?: () => void;
  onSave?: (article: Partial<KBArticle>) => Promise<void>;
  canEdit?: boolean;
}

export function ArticleView({ article, onBack, onSave, canEdit = false }: ArticleViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedDescription, setEditedDescription] = useState(article.description || '');
  const [showTagInput, setShowTagInput] = useState(false);
  const [editedTags, setEditedTags] = useState(article.kb_article_tags?.map(tag => tag.kb_tags.id) || []);
  const editorRef = useRef<ArticleEditorRef>(null);

  const handleSave = async (content: string) => {
    if (onSave) {
      await onSave({
        ...article,
        title: editedTitle,
        description: editedDescription,
        content,
        kb_article_tags: editedTags.map(tagId => ({
          kb_tags: {
            id: tagId,
            name: article.kb_article_tags?.find(t => t.kb_tags.id === tagId)?.kb_tags.name || '',
            slug: article.kb_article_tags?.find(t => t.kb_tags.id === tagId)?.kb_tags.slug || '',
            color: article.kb_article_tags?.find(t => t.kb_tags.id === tagId)?.kb_tags.color || '',
            created_at: article.kb_article_tags?.find(t => t.kb_tags.id === tagId)?.kb_tags.created_at || new Date().toISOString(),
            updated_at: article.kb_article_tags?.find(t => t.kb_tags.id === tagId)?.kb_tags.updated_at || new Date().toISOString()
          }
        }))
      });
    }
    setIsEditing(false);
  };

  const toggleTag = (tagId: string) => {
    setEditedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Transform article tags into the format expected by TagSelector
  const allTags = article.kb_article_tags?.map(tag => ({
    id: tag.kb_tags.id,
    label: tag.kb_tags.name,
    color: tag.kb_tags.color
  })) || [];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </button>
          )}
          {canEdit && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      const content = editorRef.current?.getContent() || article.content;
                      handleSave(content);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 hover:bg-gray-50"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Article
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-3xl font-semibold mb-4 p-2 border border-gray-200 rounded-lg"
              placeholder="Article title"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full mb-4 p-2 border border-gray-200 rounded-lg"
              rows={2}
              placeholder="Brief description of the article"
            />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold mb-4">{article.title}</h1>
            {article.description && (
              <p className="text-gray-600 mb-4">{article.description}</p>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {(isEditing ? editedTags : article.kb_article_tags?.map(tag => tag.kb_tags.id) || []).map((tagId) => {
            const tag = article.kb_article_tags?.find(t => t.kb_tags.id === tagId)?.kb_tags;
            if (!tag) return null;
            return (
              <div key={tagId} className="flex items-center gap-1">
                <span
                  style={getTagStyles(tag.color)}
                  className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                >
                  {tag.name}
                  {isEditing && (
                    <button
                      onClick={() => toggleTag(tagId)}
                      className="hover:text-gray-700 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              </div>
            );
          })}
          {isEditing && (
            <div className="relative">
              {showTagInput ? (
                <TagSelector
                  tags={allTags}
                  editedTags={editedTags}
                  toggleTag={toggleTag}
                  setShowTagInput={setShowTagInput}
                />
              ) : (
                <CollapsedTagSelector onClick={() => setShowTagInput(true)} />
              )}
            </div>
          )}
        </div>
      </div>
      
      <ArticleEditor
        ref={editorRef}
        content={article.content}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
      
      <div className="mt-8 text-sm text-gray-500 border-t pt-4">
        <p>Last updated: {new Date(article.updated_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
} 