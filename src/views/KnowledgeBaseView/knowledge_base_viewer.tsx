import { useState } from "react";
import { ArrowLeft, Edit2, Save } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import CodeBlock from "@tiptap/extension-code-block";
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
  const [editedDescription, setEditedDescription] = useState(
    article.description,
  );
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      CodeBlock,
    ],
    content:
      article.content ||
      `
      <h2>Introduction</h2>
      <p>This comprehensive guide will walk you through everything you need to know about ${article.title}. We'll cover the fundamentals, best practices, and advanced techniques.</p>
      <h3>Key Concepts</h3>
      <ul>
        <li>Understanding the basics</li>
        <li>Core principles and patterns</li>
        <li>Advanced implementation strategies</li>
      </ul>
    `,
    editable: isEditing,
  });
  const handleSave = () => {
    if (onSave && editor) {
      onSave({
        ...article,
        title: editedTitle,
        description: editedDescription,
        content: editor.getHTML(),
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
        {editor && (
          <div
            className={`prose max-w-none ${isEditing ? "border border-gray-200 rounded-lg" : ""}`}
          >
            {isEditing && (
              <div className="border-b border-gray-200 p-2 bg-gray-50 flex gap-2">
                <button
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({
                        level: 2,
                      })
                      .run()
                  }
                  className={`p-1 rounded ${
                    editor.isActive("heading", {
                      level: 2,
                    })
                      ? "bg-gray-200"
                      : "hover:bg-gray-200"
                  }`}
                >
                  H2
                </button>
                <button
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({
                        level: 3,
                      })
                      .run()
                  }
                  className={`p-1 rounded ${
                    editor.isActive("heading", {
                      level: 3,
                    })
                      ? "bg-gray-200"
                      : "hover:bg-gray-200"
                  }`}
                >
                  H3
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1 rounded ${editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-200"}`}
                >
                  Bold
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1 rounded ${editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-200"}`}
                >
                  Italic
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className={`p-1 rounded ${editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-200"}`}
                >
                  • List
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`p-1 rounded ${editor.isActive("codeBlock") ? "bg-gray-200" : "hover:bg-gray-200"}`}
                >
                  Code
                </button>
              </div>
            )}
            <div className={isEditing ? "p-4" : ""}>
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
