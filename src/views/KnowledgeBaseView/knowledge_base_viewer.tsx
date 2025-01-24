import { useState } from "react";
import { ArrowLeft, Edit2, Save } from "lucide-react";
import { ArticleEditor } from "./ArticleEditor";

interface Tag {
  id: string;
  label: string;
  color: string;
}

interface Article {
  id: number;
  title: string;
  description: string;
  tags: string[];
  content?: string;
}

interface ArticleViewProps {
  article: Article;
  tags: Tag[];
  onBack: () => void;
  onSave?: (article: Article) => void;
}

export function ArticleView({
  article,
  tags,
  onBack,
  onSave,
}: ArticleViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [editedDescription, setEditedDescription] = useState(article.description);
  const [editedContent, setEditedContent] = useState(
    article.content ||
    ``
  );

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...article,
        title: editedTitle,
        description: editedDescription,
        content: editedContent,
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </button>
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors duration-200
              hover:bg-gray-50"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit Article
              </>
            )}
          </button>
        </div>
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full text-2xl font-semibold text-gray-900 mb-4 p-2 border border-gray-200 rounded-lg"
          />
        ) : (
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            {article.title}
          </h1>
        )}
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return (
              tag && (
                <span
                  key={tagId}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${tag.color}`}
                >
                  {tag.label}
                </span>
              )
            );
          })}
        </div>
      </div>
      <div className="p-6">
        {isEditing ? (
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full mb-6 p-2 border border-gray-200 rounded-lg"
            rows={2}
          />
        ) : (
          <p className="text-gray-600 mb-6">{article.description}</p>
        )}
        <ArticleEditor
          content={editedContent}
          isEditing={isEditing}
          onChange={setEditedContent}
        />
      </div>
    </div>
  );
}
