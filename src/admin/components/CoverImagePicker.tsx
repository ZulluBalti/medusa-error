import { useState, useRef } from "react"
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

type Props = {
  value: string
  onChange: (url: string) => void
}

export const CoverImagePicker = ({ value, onChange }: Props) => {
  const [mode, setMode] = useState<"preview" | "upload" | "url">(
    value ? "preview" : "upload"
  )
  const [urlInput, setUrlInput] = useState(value || "")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [urlError, setUrlError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onChange(url)
      setMode("preview")
    } catch (e: any) {
      toast.error(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleUrlConfirm = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setMode("preview")
    }
  }

  const handleRemove = () => {
    onChange("")
    setUrlInput("")
    setUrlError(false)
    setMode("upload")
  }

  // ── Preview mode ──────────────────────────────────────────────────────────
  if (mode === "preview" && value) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", background: "var(--ui-bg-subtle)" }}>
          <img
            src={value}
            alt="Cover"
            style={{ width: "100%", display: "block", maxHeight: "140px", objectFit: "cover" }}
            onError={() => setUrlError(true)}
          />
          {urlError && (
            <div style={{ padding: "12px", fontSize: "12px", color: "var(--ui-fg-muted)", textAlign: "center" }}>
              Could not load image
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => { setMode("upload"); setUrlError(false) }}
            style={{ flex: 1, padding: "5px", borderRadius: "6px", border: "1px solid var(--ui-border-base)", background: "transparent", color: "var(--ui-fg-base)", fontSize: "12px", cursor: "pointer" }}
          >
            Change
          </button>
          <button
            type="button"
            onClick={handleRemove}
            style={{ flex: 1, padding: "5px", borderRadius: "6px", border: "1px solid var(--ui-border-base)", background: "transparent", color: "var(--ui-fg-error)", fontSize: "12px", cursor: "pointer" }}
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  // ── Upload / URL mode ─────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Tab toggle */}
      <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--ui-border-base)" }}>
        {(["upload", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "5px",
              border: "none",
              background: mode === m ? "var(--ui-bg-base-pressed)" : "transparent",
              color: mode === m ? "var(--ui-fg-base)" : "var(--ui-fg-muted)",
              fontSize: "12px",
              fontWeight: mode === m ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {m === "upload" ? "Upload" : "URL"}
          </button>
        ))}
      </div>

      {mode === "upload" && (
        <>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            style={{
              border: `2px dashed ${dragOver ? "var(--ui-fg-interactive)" : "var(--ui-border-base)"}`,
              borderRadius: "8px",
              padding: "20px 12px",
              textAlign: "center",
              cursor: uploading ? "wait" : "pointer",
              background: dragOver ? "var(--ui-bg-highlight)" : "var(--ui-bg-subtle)",
              transition: "all 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "24px" }}>{uploading ? "⏳" : "🖼️"}</div>
            <div style={{ fontSize: "12px", color: "var(--ui-fg-base)", fontWeight: 500 }}>
              {uploading ? "Uploading..." : "Drop image or click to browse"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--ui-fg-muted)" }}>PNG, JPG, WebP, GIF</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </>
      )}

      {mode === "url" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <input
            autoFocus
            value={urlInput}
            onChange={(e) => { setUrlInput(e.target.value); setUrlError(false) }}
            onKeyDown={(e) => e.key === "Enter" && handleUrlConfirm()}
            placeholder="https://example.com/image.jpg"
            style={{
              border: "1px solid var(--ui-border-base)",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
              outline: "none",
              background: "var(--ui-bg-field)",
              color: "var(--ui-fg-base)",
              width: "100%",
            }}
          />
          {urlInput && (
            <div style={{ borderRadius: "6px", overflow: "hidden", background: "var(--ui-bg-subtle)", minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {urlError ? (
                <span style={{ fontSize: "11px", color: "var(--ui-fg-muted)", padding: "8px" }}>Could not load preview</span>
              ) : (
                <img
                  src={urlInput}
                  alt="Preview"
                  style={{ width: "100%", maxHeight: "120px", objectFit: "cover", display: "block" }}
                  onError={() => setUrlError(true)}
                  onLoad={() => setUrlError(false)}
                />
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleUrlConfirm}
            disabled={!urlInput.trim()}
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "none",
              background: urlInput.trim() ? "var(--ui-button-inverted)" : "var(--ui-bg-disabled)",
              color: urlInput.trim() ? "var(--ui-fg-on-inverted)" : "var(--ui-fg-disabled)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: urlInput.trim() ? "pointer" : "not-allowed",
            }}
          >
            Use this image
          </button>
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={() => setMode("preview")}
          style={{ fontSize: "11px", color: "var(--ui-fg-interactive)", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
        >
          ← Back to current image
        </button>
      )}
    </div>
  )
}
