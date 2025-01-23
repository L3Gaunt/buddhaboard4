import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import CodeBlock from "@tiptap/extension-code-block";
import { Save, X } from "lucide-react";

interface ArticleEditorProps {
  content: string;
  isEditing: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export function ArticleEditor({ content, isEditing, onSave, onCancel }: ArticleEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      CodeBlock,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
    editable: isEditing,
  });

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
          <div className="flex-grow"></div>
          <button
            onClick={() => onSave(editor.getHTML())}
            className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1 rounded border hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}
      <div className={isEditing ? "p-4" : ""}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
} 