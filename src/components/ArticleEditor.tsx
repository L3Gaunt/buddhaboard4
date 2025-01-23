import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { forwardRef, useImperativeHandle } from "react";

export interface ArticleEditorRef {
  getContent: () => string;
}

interface ArticleEditorProps {
  content: string;
  isEditing: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const ArticleEditor = forwardRef<ArticleEditorRef, ArticleEditorProps>(
  ({ content, isEditing}, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
        },
      },
      editable: isEditing,
    }, [isEditing, content]);

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || content,
    }));

    if (!editor) return null;

    return (
      <div className={`prose max-w-none ${isEditing ? "border border-gray-200 rounded-lg" : ""}`}>
        {isEditing && (
          <div className="border-b border-gray-200 p-2 bg-gray-50 flex gap-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : "hover:bg-gray-200"}`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1 rounded ${editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : "hover:bg-gray-200"}`}
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
              onClick={() => editor.chain().focus().toggleBulletList().run()}
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
    );
  }
); 