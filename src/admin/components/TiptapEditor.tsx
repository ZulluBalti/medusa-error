import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import Youtube from "@tiptap/extension-youtube"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { useCallback, useState, useEffect, useRef } from "react"
import { Node } from "@tiptap/core"
import { ImageInsertModal, VideoInsertModal } from "./MediaInsertModal"

const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return { src: { default: null } }
  },
  parseHTML() {
    return [{ tag: "video[src]" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", { ...HTMLAttributes, controls: true, style: "max-width:100%;width:100%;border-radius:8px;margin:8px 0;" }]
  },
  addCommands() {
    return {
      setVideo:
        (attrs: { src: string }) =>
        ({ commands }: any) =>
          commands.insertContent({ type: this.name, attrs }),
    } as any
  },
})

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      padding: "4px 8px",
      borderRadius: "4px",
      border: "none",
      background: active ? "var(--ui-bg-interactive)" : "transparent",
      color: active ? "var(--ui-fg-on-inverted)" : "var(--ui-fg-base)",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: active ? 600 : 400,
      minWidth: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </button>
)

const Divider = () => (
  <div
    style={{
      width: "1px",
      height: "20px",
      background: "var(--ui-border-base)",
      margin: "0 4px",
    }}
  />
)

type TiptapEditorProps = {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export const TiptapEditor = ({
  content,
  onChange,
  placeholder = "Start writing your blog post...",
}: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: { languageClassPrefix: "language-" },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Youtube.configure({ controls: true, nocookie: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      VideoNode,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const contentLoaded = useRef(false)
  useEffect(() => {
    if (editor && content && !contentLoaded.current) {
      editor.commands.setContent(content, false)
      contentLoaded.current = true
    }
  }, [editor, content])

  const [imageModal, setImageModal] = useState(false)
  const [videoModal, setVideoModal] = useState(false)
  const [linkPopover, setLinkPopover] = useState(false)
  const [linkValue, setLinkValue] = useState("")

  const setLink = useCallback((url: string) => {
    if (!editor) return
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback((url: string) => {
    if (!editor || !url) return
    editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  const addYoutube = useCallback((url: string) => {
    if (!editor || !url) return
    editor.commands.setYoutubeVideo({ src: url })
  }, [editor])

  const addVideo = useCallback((url: string) => {
    if (!editor || !url) return
    ;(editor.commands as any).setVideo({ src: url })
  }, [editor])

  if (!editor) return null

  return (
    <div
      style={{
        border: "1px solid var(--ui-border-base)",
        borderRadius: "8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: "400px",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "2px",
          padding: "8px 12px",
          borderBottom: "1px solid var(--ui-border-base)",
          background: "var(--ui-bg-subtle)",
          overflow: "visible",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* History */}
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>↩</ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>↪</ToolbarButton>
        <Divider />

        {/* Headings */}
        <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
        <ToolbarButton title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>¶</ToolbarButton>
        <Divider />

        {/* Inline formatting */}
        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolbarButton>
        <ToolbarButton title="Inline Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>{"<>"}</ToolbarButton>
        <Divider />

        {/* Text color */}
        <label title="Text Color" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: "13px", marginRight: "2px", color: "var(--ui-fg-base)" }}>A</span>
          <input
            type="color"
            style={{ width: "20px", height: "20px", border: "none", padding: 0, cursor: "pointer", background: "transparent" }}
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
          />
        </label>
        <ToolbarButton title="Clear Color" onClick={() => editor.chain().focus().unsetColor().run()}>✕</ToolbarButton>
        <ToolbarButton title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}>🖊</ToolbarButton>
        <Divider />

        {/* Alignment */}
        <ToolbarButton title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>⬅</ToolbarButton>
        <ToolbarButton title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>↔</ToolbarButton>
        <ToolbarButton title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>➡</ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>☰</ToolbarButton>
        <Divider />

        {/* Lists */}
        <ToolbarButton title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• —</ToolbarButton>
        <ToolbarButton title="Ordered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarButton>
        <ToolbarButton title="Task List" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>☑</ToolbarButton>
        <Divider />

        {/* Block elements */}
        <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>"</ToolbarButton>
        <ToolbarButton title="Code Block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{"{ }"}</ToolbarButton>
        <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</ToolbarButton>
        <Divider />

        {/* Media */}
        <div style={{ position: "relative" }}>
          <ToolbarButton
            title="Link"
            active={editor.isActive("link") || linkPopover}
            onClick={() => {
              setImageModal(false)
              setVideoModal(false)
              setLinkValue(editor.getAttributes("link").href || "")
              setLinkPopover((v) => !v)
            }}
          >
            🔗
          </ToolbarButton>
          {linkPopover && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                zIndex: 50,
                background: "var(--ui-bg-base)",
                border: "1px solid var(--ui-border-base)",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minWidth: "300px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ui-fg-subtle)" }}>Insert Link</span>
              <input
                autoFocus
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { setLink(linkValue); setLinkPopover(false) }
                  if (e.key === "Escape") setLinkPopover(false)
                }}
                placeholder="https://example.com"
                style={{ border: "1px solid var(--ui-border-base)", borderRadius: "6px", padding: "6px 10px", fontSize: "13px", outline: "none", background: "var(--ui-bg-field)", color: "var(--ui-fg-base)", width: "100%" }}
              />
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setLinkPopover(false)} style={{ padding: "5px 12px", borderRadius: "6px", border: "1px solid var(--ui-border-base)", background: "transparent", color: "var(--ui-fg-subtle)", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={() => { setLink(linkValue); setLinkPopover(false) }} style={{ padding: "5px 12px", borderRadius: "6px", border: "none", background: "var(--ui-button-inverted)", color: "var(--ui-fg-on-inverted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Insert</button>
              </div>
            </div>
          )}
        </div>
        <ToolbarButton title="Image" active={imageModal} onClick={() => { setLinkPopover(false); setVideoModal(false); setImageModal(true) }}>🖼</ToolbarButton>
        <ToolbarButton title="Video" active={videoModal} onClick={() => { setLinkPopover(false); setImageModal(false); setVideoModal(true) }}>▶</ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{ flex: 1, overflowY: "auto" }}
        className="tiptap-editor"
      />

      <ImageInsertModal
        open={imageModal}
        onClose={() => setImageModal(false)}
        onInsert={(url) => { addImage(url); editor.commands.focus() }}
      />
      <VideoInsertModal
        open={videoModal}
        onClose={() => setVideoModal(false)}
        onYoutube={(url) => { addYoutube(url); editor.commands.focus() }}
        onVideoUrl={(url) => { addVideo(url); editor.commands.focus() }}
      />

      <style>{`
        .tiptap-editor .ProseMirror {
          padding: 20px 24px;
          min-height: 360px;
          outline: none;
          font-size: 15px;
          line-height: 1.7;
          color: var(--ui-fg-base);
        }
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--ui-fg-muted);
          pointer-events: none;
          float: left;
          height: 0;
        }
        .tiptap-editor .ProseMirror h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror h2 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror ul, .tiptap-editor .ProseMirror ol { padding-left: 1.5em; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror li { margin: 0.25em 0; }
        .tiptap-editor .ProseMirror blockquote { border-left: 3px solid var(--ui-border-strong); padding-left: 1em; margin: 1em 0; color: var(--ui-fg-subtle); }
        .tiptap-editor .ProseMirror code { background: var(--ui-bg-subtle); padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        .tiptap-editor .ProseMirror pre { background: var(--ui-bg-base-pressed); border-radius: 6px; padding: 16px; overflow-x: auto; margin: 1em 0; }
        .tiptap-editor .ProseMirror pre code { background: transparent; padding: 0; }
        .tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 6px; margin: 1em 0; }
        .tiptap-editor .ProseMirror a { color: var(--ui-fg-interactive); text-decoration: underline; }
        .tiptap-editor .ProseMirror hr { border: none; border-top: 2px solid var(--ui-border-base); margin: 1.5em 0; }
        .tiptap-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap-editor .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
        .tiptap-editor .ProseMirror ul[data-type="taskList"] li label { margin-top: 3px; }
        .tiptap-editor .ProseMirror .is-empty::before { content: attr(data-placeholder); color: var(--ui-fg-muted); pointer-events: none; float: left; height: 0; }
      `}</style>
    </div>
  )
}

export default TiptapEditor
