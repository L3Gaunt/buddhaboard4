import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { getTags } from "../services/knowledge-base";
import type { KBTag } from "../types/knowledge-base";
import { getTagStyles } from "../views/KnowledgeBaseView";

// Convert HSL to Hex color
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Generate a random hex color
const generateRandomHexColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 20) + 60; // 60-80% saturation
  const lightness = Math.floor(Math.random() * 20) + 35; // 35-55% lightness
  return hslToHex(hue, saturation, lightness);
};

interface TagSelectorProps {
  editedTags: string[];
  toggleTag: (tagId: string, tag: KBTag) => void;
  setShowTagInput: (show: boolean) => void;
  onCreateTag?: (tag: Omit<KBTag, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface CollapsedTagSelectorProps {
  onClick: () => void;
}

export function TagSelector({
  editedTags,
  toggleTag,
  setShowTagInput,
  onCreateTag,
}: TagSelectorProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [tags, setTags] = useState<KBTag[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const tagsData = await getTags();
      if (tagsData) {
        setTags(tagsData);
      }
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const handleCreateTag = () => {
    if (!newTagInput.trim()) return;
    
    const newTag = {
      name: newTagInput.trim(),
      color: generateRandomHexColor(),
      slug: newTagInput.trim().toLowerCase().replace(/\s+/g, '-'),
    };

    // Pass the new tag up to parent component
    if (onCreateTag) {
      onCreateTag(newTag);
    }
    
    setNewTagInput("");
    setShowTagInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <div className="absolute z-10 w-64 bg-white border rounded-lg shadow-lg p-2 transform -translate-y-1">
      <button
        onClick={() => setShowTagInput(false)}
        className="absolute -top-2 -left-2 p-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50"
        aria-label="Close tag selector"
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>
      <div className="space-y-2">
        <div className="flex gap-2 pb-2 border-b border-gray-100">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Create new tag..."
            className="flex-1 px-3 py-1 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleCreateTag}
            disabled={!newTagInput.trim()}
            className="px-3 py-1 text-sm rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                toggleTag(tag.id, tag);
                setShowTagInput(false);
              }}
              style={getTagStyles(tag.color)}
              className="w-full text-left px-3 py-1 rounded-full text-sm font-medium hover:bg-opacity-20"
            >
              {tag.name}
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
