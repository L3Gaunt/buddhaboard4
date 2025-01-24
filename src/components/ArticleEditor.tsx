import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { forwardRef, useImperativeHandle, useEffect } from "react";
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Heading from '@tiptap/extension-heading';

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
        StarterKit,
        Heading.configure({
          levels: [1, 2, 3],
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:underline',
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        Highlight.configure({
          multicolor: true,
        }),
      ],
      content: content || '',
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none',
        },
      },
      editable: isEditing,
    });

    // Update content when it changes externally
    useEffect(() => {
      if (editor && editor.getHTML() !== content) {
        editor.commands.setContent(content || '');
      }
    }, [content, editor]);

    // Update editable state when it changes
    useEffect(() => {
      if (editor) {
        editor.setEditable(isEditing);
      }
    }, [editor, isEditing]);

    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || content,
    }));

    if (!editor) return null;

    return (
      <div className={`prose max-w-none ${isEditing ? "border border-gray-200 rounded-lg" : ""}`}>
        {isEditing && (
          <div className="border-b border-gray-200 p-2 bg-gray-50 flex gap-2 flex-wrap">
            <div className="flex gap-2 items-center border-r pr-2">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1 rounded ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : "hover:bg-gray-200"}`}
              >
                H1
              </button>
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
            </div>

            <div className="flex gap-2 items-center border-r pr-2">
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
                onClick={() => {
                  const url = window.prompt('URL');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                className={`p-1 rounded ${editor.isActive("link") ? "bg-gray-200" : "hover:bg-gray-200"}`}
              >
                Link
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-1 rounded ${editor.isActive("highlight") ? "bg-gray-200" : "hover:bg-gray-200"}`}
              >
                Highlight
              </button>
            </div>

            <div className="flex gap-2 items-center border-r pr-2">
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1 rounded ${editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-200"}`}
              >
                • List
              </button>
              <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`p-1 rounded ${editor.isActive("taskList") ? "bg-gray-200" : "hover:bg-gray-200"}`}
              >
                Task List
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1 rounded ${editor.isActive("codeBlock") ? "bg-gray-200" : "hover:bg-gray-200"}`}
              >
                Code
              </button>
              <button
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="p-1 rounded hover:bg-gray-200"
              >
                Table
              </button>
            </div>
          </div>
        )}
        <div className={isEditing ? "p-4" : ""}>
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);