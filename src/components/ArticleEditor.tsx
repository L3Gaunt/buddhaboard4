import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { KBArticle, KBTag } from '../types/knowledge-base'

interface ArticleEditorProps {
  article?: KBArticle
  tags: KBTag[]
  onSave: (article: Partial<KBArticle>) => Promise<void>
  onCancel: () => void
}

export function ArticleEditor({ article, tags, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || '')
  const [description, setDescription] = useState(article?.description || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    article?.kb_article_tags?.map(at => at.kb_tags.id) || []
  )
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(
    article?.status || 'draft'
  )
  const [saving, setSaving] = useState(false)
  const [slug, setSlug] = useState(article?.slug || '')

  const editor = useEditor({
    extensions: [StarterKit],
    content: article?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none',
      },
    },
  })

  // Generate slug from title
  useEffect(() => {
    if (!article?.slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [title, article?.slug])

  const handleSave = async () => {
    if (!editor) return
    setSaving(true)
    try {
      await onSave({
        title,
        slug,
        description,
        content: editor.getHTML(),
        status,
        kb_article_tags: selectedTags.map(tagId => ({
          kb_tags: tags.find(t => t.id === tagId)!
        })),
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Article title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="article-url-slug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Brief description of the article"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors
                  ${selectedTags.includes(tag.id) ? tag.color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {tag.name}
                {selectedTags.includes(tag.id) && <X className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <div className="prose-editor border border-gray-300 rounded-lg p-4">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title || !editor?.getHTML()}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
} 