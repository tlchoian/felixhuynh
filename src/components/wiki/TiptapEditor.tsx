import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
  Code2,
  Undo,
  Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const lowlight = createLowlight(common);

interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: any) => void;
}

const slashMenuItems: SlashMenuItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: <Heading1 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Heading2 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Heading3 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: <List className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: <ListOrdered className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Code Block',
    description: 'Insert a code snippet',
    icon: <Code2 className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Quote',
    description: 'Insert a blockquote',
    icon: <Quote className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Insert a horizontal divider',
    icon: <Minus className="w-4 h-4" />,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Image',
    description: 'Insert an image from URL',
    icon: <ImageIcon className="w-4 h-4" />,
    command: (editor) => {
      const url = window.prompt('Enter image URL');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
];

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, editable = true, placeholder = 'Type / for commands...' }: TiptapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterText, setFilterText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = slashMenuItems.filter(item =>
    item.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto',
        },
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-1',
      },
      handleKeyDown: (view, event) => {
        if (showSlashMenu) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
            return true;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (filteredItems[selectedIndex]) {
              executeCommand(filteredItems[selectedIndex]);
            }
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setShowSlashMenu(false);
            setFilterText('');
            return true;
          }
          if (event.key === 'Backspace' && filterText === '') {
            setShowSlashMenu(false);
            return false;
          }
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            setFilterText((prev) => prev + event.key);
            setSelectedIndex(0);
          }
          if (event.key === 'Backspace' && filterText.length > 0) {
            setFilterText((prev) => prev.slice(0, -1));
            setSelectedIndex(0);
          }
        }
        return false;
      },
    },
  });

  const executeCommand = useCallback((item: SlashMenuItem) => {
    if (!editor) return;
    
    // Delete the slash and filter text
    const { state } = editor;
    const { from } = state.selection;
    const slashPos = from - filterText.length - 1;
    
    editor.chain()
      .focus()
      .deleteRange({ from: slashPos, to: from })
      .run();
    
    item.command(editor);
    setShowSlashMenu(false);
    setFilterText('');
    setSelectedIndex(0);
  }, [editor, filterText]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !showSlashMenu && editable) {
        setTimeout(() => {
          const { view } = editor;
          const { state } = view;
          const { selection } = state;
          const { from } = selection;
          
          const coords = view.coordsAtPos(from);
          const editorRect = view.dom.getBoundingClientRect();
          
          setSlashMenuPosition({
            top: coords.top - editorRect.top + 24,
            left: coords.left - editorRect.left,
          });
          setShowSlashMenu(true);
          setSelectedIndex(0);
          setFilterText('');
        }, 10);
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, showSlashMenu, editable]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSlashMenu(false);
        setFilterText('');
      }
    };

    if (showSlashMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSlashMenu]);

  if (!editor) return null;

  return (
    <div className="relative">
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-1 p-2 mb-2 rounded-lg bg-muted/30 border border-border/50 flex-wrap">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('bold') && 'bg-muted text-primary'
            )}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('italic') && 'bg-muted text-primary'
            )}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('strike') && 'bg-muted text-primary'
            )}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('code') && 'bg-muted text-primary'
            )}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('heading', { level: 1 }) && 'bg-muted text-primary'
            )}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('heading', { level: 2 }) && 'bg-muted text-primary'
            )}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('heading', { level: 3 }) && 'bg-muted text-primary'
            )}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('bulletList') && 'bg-muted text-primary'
            )}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('orderedList') && 'bg-muted text-primary'
            )}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('blockquote') && 'bg-muted text-primary'
            )}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('codeBlock') && 'bg-muted text-primary'
            )}
            title="Code Block"
          >
            <Code2 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Divider"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const url = window.prompt('Enter image URL');
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-border mx-1" />
          
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} />

      {showSlashMenu && editable && (
        <div
          ref={menuRef}
          className="absolute z-50 bg-popover border border-border rounded-lg shadow-xl p-2 w-64 max-h-80 overflow-y-auto"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
            {filterText ? `Searching: ${filterText}` : 'Type to filter...'}
          </div>
          {filteredItems.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              No commands found
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={item.title}
                onClick={() => executeCommand(item)}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                  index === selectedIndex ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                )}
              >
                <div className="p-1.5 rounded bg-muted">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
