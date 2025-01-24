import { useState, useRef } from 'react';
import { ArrowLeft, Edit2, Save, X, Trash2, FileText } from 'lucide-react';
import type { KBArticle, KBTag } from '../types/knowledge-base';
import { getTagStyles } from '../views/KnowledgeBaseView';
import { ArticleEditor, ArticleEditorRef } from './ArticleEditor';
import { TagSelector, CollapsedTagSelector } from './TagSelectorInArticleEditor';

interface ArticleViewProps {
  article: KBArticle | null;
  onBack?: () => void;
  onSave?: (article: Partial<KBArticle>) => Promise<void>;
  onDelete?: () => Promise<void>;
  canEdit?: boolean;
  isCreating?: boolean;
}

export function ArticleView({ article, onBack, onSave, onDelete, canEdit = false, isCreating = false }: ArticleViewProps) {
  // If article is null, show loading state
  if (!article) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          {onBack && !isCreating && (
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </button>
          )}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(isCreating);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedDescription, setEditedDescription] = useState(article.description || '');
  const [showTagInput, setShowTagInput] = useState(false);
  const [editedTags, setEditedTags] = useState(article.kb_article_tags?.map(tag => tag.kb_tags.id) || []);
  const [tagData, setTagData] = useState<Record<string, KBTag>>(
    Object.fromEntries(
      (article.kb_article_tags || []).map(tag => [tag.kb_tags.id, tag.kb_tags])
    )
  );
  const editorRef = useRef<ArticleEditorRef>(null);

  const handleSave = async (content: string, status: 'draft' | 'published' | 'archived' = 'published') => {
    if (!onSave) return;
    await onSave({
      ...article,
      title: editedTitle,
      description: editedDescription,
      content,
      status,
      kb_article_tags: editedTags.map(tagId => ({
        kb_tags: tagData[tagId]
      }))
    });
    if (!isCreating) {
      setIsEditing(false);
    }
  };

  const toggleTag = (tagId: string, tag: KBTag) => {
    setEditedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
    
    if (tag) {
      setTagData(prev => ({
        ...prev,
        [tagId]: tag
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {onBack && !isCreating && (
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
                    {isCreating ? "Create Article" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      const content = editorRef.current?.getContent() || article.content;
                      handleSave(content, 'draft');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                  >
                    <FileText className="h-4 w-4" />
                    Save as draft
                  </button>
                  <button
                    onClick={() => {
                      if (isCreating && onBack) {
                        onBack();
                      } else {
                        setIsEditing(false);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200 hover:bg-gray-50"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Article
                  </button>
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 transition-colors duration-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </>
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
          {editedTags.map((tagId) => {
            const tag = tagData[tagId];
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
                      onClick={() => toggleTag(tagId, tag)}
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