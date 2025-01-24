import { useState } from "react";
import { Plus } from "lucide-react";
interface Tag {
  id: string;
  label: string;
  color: string;
}
interface TagSelectorProps {
  tags: Tag[];
  editedTags: string[];
  toggleTag: (tagId: string) => void;
  setShowTagInput: (show: boolean) => void;
  onCreateTag?: (label: string) => void;
}
interface CollapsedTagSelectorProps {
  onClick: () => void;
}
export function TagSelector({
  tags,
  editedTags,
  toggleTag,
  setShowTagInput,
  onCreateTag,
}: TagSelectorProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const handleCreateTag = () => {
    if (newTagInput.trim() && onCreateTag) {
      onCreateTag(newTagInput.trim());
      setNewTagInput("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  };
  return (
    <div className="absolute top-0 left-0 z-10 w-64 bg-white border rounded-lg shadow-lg p-2">
      <div className="space-y-2">
        <div className="flex gap-2 pb-2 border-b border-gray-100">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Create new tag..."
            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleCreateTag}
            disabled={!newTagInput.trim()}
            className="px-2 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
        <div className="space-y-1">
          {tags
            .filter((tag) => !editedTags.includes(tag.id))
            .map((tag) => (
              <button
                key={tag.id}
                onClick={() => {
                  toggleTag(tag.id);
                  setShowTagInput(false);
                }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-gray-50 ${tag.color}`}
              >
                {tag.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
export function CollapsedTagSelector({ onClick }: CollapsedTagSelectorProps) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-full text-sm border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center gap-1"
    >
      <Plus className="h-3 w-3" />
      Add tag
    </button>
  );
}
