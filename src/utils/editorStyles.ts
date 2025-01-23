import { cn } from '@/lib/utils';

export type EditorVariant = 'default' | 'customer-notes';

export const getEditorContainerStyles = (variant: EditorVariant = 'default') => {
  return cn(
    'border rounded-lg overflow-hidden',
    variant === 'customer-notes' && 'border-gray-200'
  );
};

export const getEditorToolbarStyles = (variant: EditorVariant = 'default') => {
  return cn(
    'border-b p-2 flex gap-1',
    variant === 'default' && 'bg-gray-50',
    variant === 'customer-notes' && 'bg-gray-100/50 p-1'
  );
};

export const getEditorContentStyles = (variant: EditorVariant = 'default') => {
  return cn(
    'p-4 resize-y overflow-auto [&_.ProseMirror]:outline-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4',
    variant === 'default' && 'min-h-[100px] max-h-[400px] [&_.ProseMirror]:min-h-[100px]',
    variant === 'customer-notes' && 'min-h-[60px] max-h-[200px] [&_.ProseMirror]:min-h-[60px] bg-white/50'
  );
}; 