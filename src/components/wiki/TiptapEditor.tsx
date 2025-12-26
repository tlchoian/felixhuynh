import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
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
  Link as LinkIcon,
  Highlighter,
  Type,
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

const highlightColors = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bfdbfe' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Orange', color: '#fed7aa' },
];

const textColors = [
  { name: 'Default', color: 'inherit' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
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
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bubbleMenuRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      
      if (hasSelection && editable) {
        // Get the selection coordinates
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const editorRect = editorContainerRef.current?.getBoundingClientRect();
        
        if (editorRect) {
          const top = start.top - editorRect.top - 50;
          const left = Math.max(0, (start.left + end.left) / 2 - editorRect.left - 100);
          
          setBubbleMenuPosition({ top, left });
          setShowBubbleMenu(true);
        }
      } else {
        setShowBubbleMenu(false);
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
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

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

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
          const editorRect = editorContainerRef.current?.getBoundingClientRect();
          
          if (editorRect) {
            setSlashMenuPosition({
              top: coords.top - editorRect.top + 24,
              left: coords.left - editorRect.left,
            });
            setShowSlashMenu(true);
            setSelectedIndex(0);
            setFilterText('');
          }
        }, 10);
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, showSlashMenu, editable]);

  // Only sync content on initial load or when explicitly requested
  const initialContentRef = useRef(content);
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    if (editor && !hasInitializedRef.current) {
      editor.commands.setContent(content || '');
      hasInitializedRef.current = true;
      initialContentRef.current = content;
    }
  }, [editor]);

  // Reset initialization when content prop changes significantly (e.g., switching articles)
  useEffect(() => {
    if (initialContentRef.current !== content && !editor?.isFocused) {
      hasInitializedRef.current = false;
      initialContentRef.current = content;
    }
  }, [content, editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSlashMenu(false);
        setFilterText('');
      }
      if (bubbleMenuRef.current && !bubbleMenuRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) return null;

  return (
    <div className="relative" ref={editorContainerRef}>
      {/* Floating Bubble Menu for text selection */}
      {showBubbleMenu && editable && (
        <div
          ref={bubbleMenuRef}
          className="absolute z-50 flex items-center gap-1 p-1.5 rounded-lg bg-popover border border-border shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ top: bubbleMenuPosition.top, left: bubbleMenuPosition.left }}
        >
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
          
          <div className="w-px h-5 bg-border mx-0.5" />
          
          <button
            onClick={setLink}
            className={cn(
              'p-1.5 rounded hover:bg-muted transition-colors',
              editor.isActive('link') && 'bg-muted text-primary'
            )}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          
          <div className="w-px h-5 bg-border mx-0.5" />
          
          {/* Text Color Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
              }}
              className="p-1.5 rounded hover:bg-muted transition-colors"
              title="Text Color"
            >
              <Type className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-xl z-50 flex gap-1">
                {textColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      if (color.color === 'inherit') {
                        editor.chain().focus().unsetColor().run();
                      } else {
                        editor.chain().focus().setColor(color.color).run();
                      }
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: color.color === 'inherit' ? 'transparent' : color.color }}
                    title={color.name}
                  >
                    {color.color === 'inherit' && <span className="text-xs">A</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Highlight Color Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
              }}
              className={cn(
                'p-1.5 rounded hover:bg-muted transition-colors',
                editor.isActive('highlight') && 'bg-muted text-primary'
              )}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-popover border border-border rounded-lg shadow-xl z-50 flex gap-1">
                <button
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform flex items-center justify-center"
                  title="Remove Highlight"
                >
                  <span className="text-xs">✕</span>
                </button>
                {highlightColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color: color.color }).run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.color }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <EditorContent editor={editor} />

      {/* Slash Command Menu */}
      {showSlashMenu && editable && (
        <div
          ref={menuRef}
          className="absolute z-50 bg-popover border border-border rounded-lg shadow-xl p-2 w-72 max-h-80 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <div className="text-xs text-muted-foreground px-2 py-1 mb-1 font-medium uppercase tracking-wide">
            {filterText ? `Searching: ${filterText}` : 'Basic blocks'}
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
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
                  index === selectedIndex ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                )}
              >
                <div className="p-2 rounded-md bg-muted border border-border/50">
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
