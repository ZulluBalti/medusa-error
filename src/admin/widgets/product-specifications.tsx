"use client"

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Heading, Button, Input, Text } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

type Spec = {
  id: string
  key: string
  value: string
  sort_order: number
  variant_id: string | null
}

type Variant = { id: string; title: string | null; options?: { value: string }[] }

const BASE_URL = ""

async function fetchSpecs(productId: string): Promise<Spec[]> {
  const res = await fetch(`${BASE_URL}/admin/products/${productId}/specifications`, {
    credentials: "include",
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.specifications ?? []
}

function variantLabel(v: Variant): string {
  if (v.title) return v.title
  if (v.options && v.options.length > 0) return v.options.map((o) => o.value).join(" / ")
  return v.id.slice(-6)
}

const ProductSpecificationsWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient()
  const qKey = ["product-specs", product.id]
  const { data: specs = [], isLoading } = useQuery<Spec[]>({
    queryKey: qKey,
    queryFn: () => fetchSpecs(product.id),
  })

  const { data: fetchedVariants = [] } = useQuery<Variant[]>({
    queryKey: ["product-variants", product.id],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/admin/products/${product.id}?fields=*variants,*variants.options`, {
        credentials: "include",
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.product?.variants ?? []
    },
  })

  const variants: Variant[] = fetchedVariants.length > 0
    ? fetchedVariants
    : (product.variants as Variant[]) ?? []

  const [addKey, setAddKey] = useState("")
  const [addValue, setAddValue] = useState("")
  const [addVariantId, setAddVariantId] = useState<string>("")
  const [showAdd, setShowAdd] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editKey, setEditKey] = useState("")
  const [editValue, setEditValue] = useState("")
  const [editVariantId, setEditVariantId] = useState<string>("")

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE_URL}/admin/products/${product.id}/specifications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: addKey.trim(),
          value: addValue.trim(),
          sort_order: specs.length,
          variant_id: addVariantId || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
      setAddKey("")
      setAddValue("")
      setAddVariantId("")
      setShowAdd(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, key, value, variant_id }: { id: string; key: string; value: string; variant_id: string | null }) => {
      const res = await fetch(`${BASE_URL}/admin/specifications/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, variant_id }),
      })
      if (!res.ok) throw new Error("Failed to update")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
      setEditId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE_URL}/admin/specifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qKey })
    },
  })

  const startEdit = (spec: Spec) => {
    setEditId(spec.id)
    setEditKey(spec.key)
    setEditValue(spec.value)
    setEditVariantId(spec.variant_id ?? "")
  }

  // Group specs: product-level first, then per variant
  const productLevelSpecs = specs.filter((s) => s.variant_id === null)
  const variantGroups = variants.map((v) => ({
    variant: v,
    specs: specs.filter((s) => s.variant_id === v.id),
  }))

  const ScopeSelect = ({
    value,
    onChange,
  }: {
    value: string
    onChange: (v: string) => void
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-ui-border-base bg-ui-bg-base text-ui-fg-base px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ui-border-interactive min-w-[140px] [color-scheme:light]"
    >
      <option value="">All variants</option>
      {variants.map((v) => (
        <option key={v.id} value={v.id}>
          {variantLabel(v)}
        </option>
      ))}
    </select>
  )

  const SpecRow = ({ spec }: { spec: Spec }) => {
    if (editId === spec.id) {
      return (
        <div className="grid grid-cols-[140px_1fr_2fr_auto] items-center gap-x-3 px-6 py-3">
          <ScopeSelect value={editVariantId} onChange={setEditVariantId} />
          <Input size="small" value={editKey} onChange={(e) => setEditKey(e.target.value)} placeholder="Key" />
          <Input size="small" value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Value" />
          <div className="flex gap-x-2">
            <Button
              size="small"
              onClick={() =>
                updateMutation.mutate({
                  id: spec.id,
                  key: editKey,
                  value: editValue,
                  variant_id: editVariantId || null,
                })
              }
              disabled={updateMutation.isPending}
            >
              Save
            </Button>
            <Button size="small" variant="secondary" onClick={() => setEditId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-x-4 px-6 py-3">
        <Text size="small" weight="plus" leading="compact">{spec.key}</Text>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">{spec.value}</Text>
        <div className="flex gap-x-2">
          <Button size="small" variant="secondary" onClick={() => startEdit(spec)}>Edit</Button>
          <Button
            size="small"
            variant="danger"
            onClick={() => deleteMutation.mutate(spec.id)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </div>
    )
  }

  const SectionHeader = ({ label, onAdd }: { label: string; onAdd: () => void }) => (
    <div className="flex items-center justify-between px-6 py-2 bg-ui-bg-subtle border-t border-ui-border-base">
      <Text size="small" weight="plus" className="text-ui-fg-subtle uppercase tracking-wide">
        {label}
      </Text>
      <Button variant="transparent" size="small" onClick={onAdd} className="text-xs">
        + Add
      </Button>
    </div>
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Technical Specifications</Heading>
        <Button variant="secondary" size="small" onClick={() => { setAddVariantId(""); setShowAdd(true) }}>
          + Add spec
        </Button>
      </div>

      {isLoading && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="grid grid-cols-[140px_1fr_2fr_auto] items-center gap-x-3 px-6 py-3">
          <ScopeSelect value={addVariantId} onChange={setAddVariantId} />
          <Input
            size="small"
            value={addKey}
            onChange={(e) => setAddKey(e.target.value)}
            placeholder="e.g. RAM"
            autoFocus
          />
          <Input
            size="small"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            placeholder="e.g. 16 GB"
          />
          <div className="flex gap-x-2">
            <Button
              size="small"
              onClick={() => createMutation.mutate()}
              disabled={!addKey.trim() || !addValue.trim() || createMutation.isPending}
            >
              Save
            </Button>
            <Button size="small" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Product-level specs */}
      {(productLevelSpecs.length > 0 || variants.length > 0) && (
        <SectionHeader label="All variants" onAdd={() => { setAddVariantId(""); setShowAdd(true) }} />
      )}
      {productLevelSpecs.length === 0 && !showAdd && (
        <div className="px-6 py-3">
          <Text size="small" className="text-ui-fg-muted italic">No product-level specs.</Text>
        </div>
      )}
      {productLevelSpecs.map((spec) => <SpecRow key={spec.id} spec={spec} />)}

      {/* Per-variant specs */}
      {variantGroups.map(({ variant, specs: vSpecs }) => (
        <div key={variant.id}>
          <SectionHeader
            label={variantLabel(variant)}
            onAdd={() => { setAddVariantId(variant.id); setShowAdd(true) }}
          />
          {vSpecs.length === 0 && (
            <div className="px-6 py-3">
              <Text size="small" className="text-ui-fg-muted italic">No specs for this variant.</Text>
            </div>
          )}
          {vSpecs.map((spec) => <SpecRow key={spec.id} spec={spec} />)}
        </div>
      ))}

      {!isLoading && specs.length === 0 && variants.length === 0 && !showAdd && (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">No specifications yet.</Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductSpecificationsWidget
