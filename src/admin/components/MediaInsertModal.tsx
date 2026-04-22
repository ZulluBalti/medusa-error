import { useState, useRef, useCallback } from "react"
import { toast } from "@medusajs/ui"

const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("files", file)

  const resp = await fetch("/admin/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.message || `Upload failed (${resp.status})`)
  }

  const data = await resp.json()
  const url = data.files?.[0]?.url
  if (!url) throw new Error("No URL returned from upload")
  return url
}

const Modal = ({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onMouseDown={onClose}
  >
    <div
      style={{
        background: "var(--ui-bg-base)",
        borderRadius: "12px",
        width: "540px",
        maxHeight: "85vh",
        overflow: "hidden",
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
)

const TabBtn = ({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "10px 18px",
      border: "none",
      borderBottom: `2px solid ${active ? "var(--ui-fg-interactive)" : "transparent"}`,
      background: "transparent",
      color: active ? "var(--ui-fg-interactive)" : "var(--ui-fg-subtle)",
      fontWeight: active ? 600 : 400,
      fontSize: "13px",
      cursor: "pointer",
      transition: "color 0.1s",
    }}
  >
    {label}
  </button>
)

const ActionBtn = ({
  onClick,
  disabled,
  children,
  variant = "primary",
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: "primary" | "secondary"
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      padding: "7px 16px",
      borderRadius: "6px",
      border: variant === "secondary" ? "1px solid var(--ui-border-base)" : "none",
      background:
        variant === "secondary"
          ? "transparent"
          : disabled
          ? "var(--ui-bg-disabled)"
          : "var(--ui-button-inverted)",
      color:
        variant === "secondary"
          ? "var(--ui-fg-base)"
          : disabled
          ? "var(--ui-fg-disabled)"
          : "var(--ui-fg-on-inverted)",
      fontSize: "13px",
      fontWeight: variant === "primary" ? 600 : 400,
      cursor: disabled ? "not-allowed" : "pointer",
    }}
  >
    {children}
  </button>
)

const UrlInput = ({
  value,
  onChange,
  placeholder,
  onEnter,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  onEnter?: () => void
}) => (
  <input
    autoFocus
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
    placeholder={placeholder}
    style={{
      border: "1px solid var(--ui-border-base)",
      borderRadius: "6px",
      padding: "8px 12px",
      fontSize: "13px",
      outline: "none",
      background: "var(--ui-bg-field)",
      color: "var(--ui-fg-base)",
      width: "100%",
    }}
  />
)

const DropZone = ({
  onFile,
  accept,
  icon,
  hint,
  preview,
  onRemove,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  fileRef,
  fileName,
  fileSize,
}: {
  onFile: (f: File) => void
  accept: string
  icon: string
  hint: string
  preview?: string | null
  onRemove?: () => void
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  fileRef: React.RefObject<HTMLInputElement>
  fileName?: string
  fileSize?: string
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    <div
      onClick={() => fileRef.current?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      style={{
        border: `2px dashed ${dragOver ? "var(--ui-fg-interactive)" : "var(--ui-border-base)"}`,
        borderRadius: "10px",
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        background: dragOver ? "var(--ui-bg-highlight)" : "var(--ui-bg-subtle)",
        transition: "all 0.15s",
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
      }}
    >
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          style={{ maxHeight: "160px", maxWidth: "100%", objectFit: "contain", borderRadius: "6px" }}
        />
      ) : fileName ? (
        <>
          <div style={{ fontSize: "36px" }}>{icon}</div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ui-fg-base)" }}>{fileName}</div>
          <div style={{ fontSize: "12px", color: "var(--ui-fg-muted)" }}>{fileSize}</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: "40px" }}>{icon}</div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ui-fg-base)" }}>
            Drop a file here, or <span style={{ color: "var(--ui-fg-interactive)", textDecoration: "underline" }}>browse</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--ui-fg-muted)" }}>{hint}</div>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
    {(fileName || preview) && onRemove && (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ fontSize: "12px", color: "var(--ui-fg-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Remove file
        </button>
      </div>
    )}
  </div>
)

// ─── Image Insert Modal ────────────────────────────────────────────────────

export const ImageInsertModal = ({
  open,
  onClose,
  onInsert,
}: {
  open: boolean
  onClose: () => void
  onInsert: (url: string) => void
}) => {
  const [tab, setTab] = useState<"upload" | "url">("upload")
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setUrl("")
    setUrlError(false)
    setFile(null)
    setPreview(null)
    setUploading(false)
    setDragOver(false)
    setTab("upload")
  }

  const close = () => { reset(); onClose() }

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Please select an image file"); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onInsert(url)
      close()
    } catch (e: any) {
      toast.error(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleUrlInsert = () => {
    if (url.trim()) { onInsert(url.trim()); close() }
  }

  if (!open) return null

  return (
    <Modal onClose={close}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ui-border-base)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--ui-fg-base)" }}>Insert Image</span>
        <button type="button" onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-fg-muted)", fontSize: "22px", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--ui-border-base)", paddingLeft: "8px" }}>
        <TabBtn label="Upload" active={tab === "upload"} onClick={() => setTab("upload")} />
        <TabBtn label="From URL" active={tab === "url"} onClick={() => setTab("url")} />
      </div>

      <div style={{ padding: "20px", overflowY: "auto" }}>
        {tab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <DropZone
              onFile={handleFile}
              accept="image/*"
              icon="🖼️"
              hint="PNG, JPG, GIF, WebP, SVG"
              preview={preview}
              onRemove={() => { setFile(null); setPreview(null) }}
              dragOver={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              fileRef={fileRef}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <ActionBtn variant="secondary" onClick={close}>Cancel</ActionBtn>
              <ActionBtn onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload & Insert"}
              </ActionBtn>
            </div>
          </div>
        )}

        {tab === "url" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <UrlInput
              value={url}
              onChange={(v) => { setUrl(v); setUrlError(false) }}
              placeholder="https://example.com/image.jpg"
              onEnter={handleUrlInsert}
            />
            {url && (
              <div style={{ borderRadius: "8px", overflow: "hidden", background: "var(--ui-bg-subtle)", padding: "8px", textAlign: "center", minHeight: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {urlError ? (
                  <span style={{ fontSize: "12px", color: "var(--ui-fg-muted)" }}>Could not load preview</span>
                ) : (
                  <img
                    src={url}
                    alt="Preview"
                    style={{ maxHeight: "220px", maxWidth: "100%", objectFit: "contain", borderRadius: "4px" }}
                    onError={() => setUrlError(true)}
                    onLoad={() => setUrlError(false)}
                  />
                )}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <ActionBtn variant="secondary" onClick={close}>Cancel</ActionBtn>
              <ActionBtn onClick={handleUrlInsert} disabled={!url.trim()}>Insert Image</ActionBtn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Video Insert Modal ────────────────────────────────────────────────────

export const VideoInsertModal = ({
  open,
  onClose,
  onYoutube,
  onVideoUrl,
}: {
  open: boolean
  onClose: () => void
  onYoutube: (url: string) => void
  onVideoUrl: (url: string) => void
}) => {
  const [tab, setTab] = useState<"youtube" | "upload" | "direct">("youtube")
  const [url, setUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => { setUrl(""); setFile(null); setUploading(false); setDragOver(false); setTab("youtube") }
  const close = () => { reset(); onClose() }

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return }
    setFile(f)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onVideoUrl(url)
      close()
    } catch (e: any) {
      toast.error(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const getYoutubeThumbnail = (u: string) => {
    const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null
  }

  if (!open) return null

  return (
    <Modal onClose={close}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ui-border-base)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: "15px", color: "var(--ui-fg-base)" }}>Insert Video</span>
        <button type="button" onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ui-fg-muted)", fontSize: "22px", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid var(--ui-border-base)", paddingLeft: "8px" }}>
        <TabBtn label="YouTube / Vimeo" active={tab === "youtube"} onClick={() => setTab("youtube")} />
        <TabBtn label="Upload Video" active={tab === "upload"} onClick={() => setTab("upload")} />
        <TabBtn label="Direct URL" active={tab === "direct"} onClick={() => setTab("direct")} />
      </div>

      <div style={{ padding: "20px", overflowY: "auto" }}>
        {tab === "youtube" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--ui-fg-subtle)" }}>
              Paste a YouTube or Vimeo link and it will be embedded in your post.
            </p>
            <UrlInput
              value={url}
              onChange={setUrl}
              placeholder="https://youtube.com/watch?v=..."
              onEnter={() => url.trim() && (onYoutube(url.trim()), close())}
            />
            {url && getYoutubeThumbnail(url) && (
              <div style={{ borderRadius: "8px", overflow: "hidden", background: "var(--ui-bg-subtle)" }}>
                <div style={{ position: "relative" }}>
                  <img src={getYoutubeThumbnail(url)!} alt="YouTube preview" style={{ width: "100%", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "white", fontSize: "20px", marginLeft: "3px" }}>▶</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <ActionBtn variant="secondary" onClick={close}>Cancel</ActionBtn>
              <ActionBtn onClick={() => { if (url.trim()) { onYoutube(url.trim()); close() } }} disabled={!url.trim()}>
                Embed Video
              </ActionBtn>
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <DropZone
              onFile={handleFile}
              accept="video/*"
              icon="🎬"
              hint="MP4, WebM, MOV, AVI"
              onRemove={() => setFile(null)}
              dragOver={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              fileRef={fileRef}
              fileName={file?.name}
              fileSize={file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : undefined}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <ActionBtn variant="secondary" onClick={close}>Cancel</ActionBtn>
              <ActionBtn onClick={handleUpload} disabled={!file || uploading}>
                {uploading ? "Uploading..." : "Upload & Insert"}
              </ActionBtn>
            </div>
          </div>
        )}

        {tab === "direct" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--ui-fg-subtle)" }}>
              Paste a direct URL to an MP4, WebM, or other video file.
            </p>
            <UrlInput
              value={url}
              onChange={setUrl}
              placeholder="https://example.com/video.mp4"
              onEnter={() => url.trim() && (onVideoUrl(url.trim()), close())}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <ActionBtn variant="secondary" onClick={close}>Cancel</ActionBtn>
              <ActionBtn onClick={() => { if (url.trim()) { onVideoUrl(url.trim()); close() } }} disabled={!url.trim()}>
                Insert Video
              </ActionBtn>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
