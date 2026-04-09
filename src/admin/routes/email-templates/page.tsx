import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EnvelopeSolid, PencilSquare, Spinner, Trash } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

// Known templates with their display names and available variables
const TEMPLATE_DEFINITIONS = [
  {
    category: "Orders",
    key: "order-confirmation",
    name: "Order Confirmation",
    description: "Sent when a customer places an order",
    variables: ["customer_name", "display_id", "total", "currency"],
  },
  {
    category: "Orders",
    key: "order-shipment",
    name: "Order Shipped",
    description: "Sent when a fulfillment is marked as shipped",
    variables: ["customer_name", "display_id", "tracking_number", "tracking_url"],
  },
  {
    category: "Orders",
    key: "order-canceled",
    name: "Order Canceled",
    description: "Sent when an order is canceled",
    variables: ["customer_name", "display_id", "total", "currency"],
  },
  {
    category: "Orders",
    key: "order-delivered",
    name: "Order Delivered",
    description: "Sent when a fulfillment is marked as delivered",
    variables: ["customer_name", "display_id", "total", "currency"],
  },
  {
    category: "Customer Account",
    key: "customer-welcome",
    name: "Customer Welcome",
    description: "Sent when a new customer registers",
    variables: ["first_name", "last_name", "full_name", "email", "phone", "customer_id"],
  },
  {
    category: "Customer Account",
    key: "password-reset",
    name: "Password Reset",
    description: "Sent when a customer requests a password reset",
    variables: ["url"],
  },
  {
    category: "Admin",
    key: "admin-invite",
    name: "Admin Invite",
    description: "Sent when an admin is invited",
    variables: ["url"],
  },
]

const CATEGORIES = ["Orders", "Customer Account", "Admin"]

type DbTemplate = {
  id: string
  template_key: string
  name: string
  subject: string
  html_body: string
  text_body: string | null
}

type FormState = {
  name: string
  subject: string
  html_body: string
  text_body: string
}

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeDefinition, setActiveDefinition] = useState<
    (typeof TEMPLATE_DEFINITIONS)[0] | null
  >(null)
  const [activeDbTemplate, setActiveDbTemplate] = useState<DbTemplate | null>(null)
  const [form, setForm] = useState<FormState>({
    name: "",
    subject: "",
    html_body: "",
    text_body: "",
  })

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: () =>
      sdk.client
        .fetch<{ email_templates: DbTemplate[] }>("/admin/email-templates")
        .then((r) => r.email_templates),
  })

  const dbTemplates = data ?? []

  const upsertMutation = useMutation({
    mutationFn: (body: FormState & { template_key: string }) =>
      sdk.client.fetch("/admin/email-templates", {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Template saved successfully")
      setDrawerOpen(false)
    },
    onError: () => {
      toast.error("Failed to save template")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/email-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      toast.success("Template reset to default")
    },
    onError: () => {
      toast.error("Failed to reset template")
    },
  })

  function openEdit(definition: (typeof TEMPLATE_DEFINITIONS)[0]) {
    const existing = dbTemplates.find((t) => t.template_key === definition.key)
    setActiveDefinition(definition)
    setActiveDbTemplate(existing ?? null)
    setForm({
      name: existing?.name ?? definition.name,
      subject: existing?.subject ?? "",
      html_body: existing?.html_body ?? "",
      text_body: existing?.text_body ?? "",
    })
    setDrawerOpen(true)
  }

  function handleSave() {
    if (!activeDefinition) return
    upsertMutation.mutate({
      template_key: activeDefinition.key,
      ...form,
    })
  }

  return (
    <div className="flex flex-col gap-y-4 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Heading>Email Templates</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Customize the transactional emails sent to your customers. Use{" "}
            <code className="text-ui-fg-base bg-ui-bg-component rounded px-1">
              {"{{variable}}"}
            </code>{" "}
            syntax for dynamic values.
          </Text>
        </div>
      </div>

      {isLoading ? (
        <Container className="p-8">
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        </Container>
      ) : (
        <div className="flex flex-col gap-y-4">
          {CATEGORIES.map((category) => {
            const defs = TEMPLATE_DEFINITIONS.filter((d) => d.category === category)
            return (
              <Container key={category} className="p-0">
                <div className="border-b border-ui-border-base px-6 py-3">
                  <Text size="small" weight="plus" className="text-ui-fg-subtle uppercase tracking-wide">
                    {category}
                  </Text>
                </div>
                <div className="divide-y divide-ui-border-base">
                  {defs.map((def) => {
                    const existing = dbTemplates.find((t) => t.template_key === def.key)
                    return (
                      <div
                        key={def.key}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div className="flex items-center gap-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ui-bg-component">
                            <EnvelopeSolid className="text-ui-fg-subtle" />
                          </div>
                          <div className="flex flex-col gap-y-0.5">
                            <div className="flex items-center gap-x-2">
                              <Text size="small" weight="plus" leading="compact">
                                {def.name}
                              </Text>
                              {existing ? (
                                <Badge size="2xsmall" color="green">
                                  Customized
                                </Badge>
                              ) : (
                                <Badge size="2xsmall" color="grey">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <Text size="small" className="text-ui-fg-subtle" leading="compact">
                              {def.description}
                            </Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-x-2">
                          {existing && (
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() => deleteMutation.mutate(existing.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash />
                              Reset
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => openEdit(def)}
                          >
                            <PencilSquare />
                            Edit
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Container>
            )
          })}
        </div>
      )}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content className="max-w-2xl">
          <Drawer.Header>
            <Drawer.Title>
              {activeDbTemplate ? "Edit" : "Customize"} — {activeDefinition?.name}
            </Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 overflow-auto p-6">
            {activeDefinition && (
              <div className="rounded-md bg-ui-bg-component p-3">
                <Text size="small" weight="plus" leading="compact">
                  Available variables
                </Text>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                  {activeDefinition.variables.map((v) => (
                    <code
                      key={v}
                      className="rounded bg-ui-bg-base px-1.5 py-0.5 text-xs text-ui-fg-base"
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="e.g. Your order #{{display_id}} has been confirmed"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>HTML Body *</Label>
              <Text size="small" className="text-ui-fg-subtle" leading="compact">
                Full HTML email content. Use{" "}
                <code className="text-ui-fg-base bg-ui-bg-component rounded px-1">
                  {"{{variable}}"}
                </code>{" "}
                for dynamic values.
              </Text>
              <Textarea
                className="min-h-64 font-mono text-xs"
                placeholder={"<h1>Hi {{customer_name}}</h1>\n<p>Your order has been placed.</p>"}
                value={form.html_body}
                onChange={(e) => setForm({ ...form, html_body: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <Label>Plain Text Body (optional)</Label>
              <Text size="small" className="text-ui-fg-subtle" leading="compact">
                Fallback for email clients that don't support HTML.
              </Text>
              <Textarea
                className="min-h-24 font-mono text-xs"
                placeholder={"Hi {{customer_name}}, your order has been placed."}
                value={form.text_body}
                onChange={(e) => setForm({ ...form, text_body: e.target.value })}
              />
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={upsertMutation.isPending}
                >
                  Cancel
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                onClick={handleSave}
                isLoading={upsertMutation.isPending}
                disabled={!form.subject || !form.html_body}
              >
                Save Template
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Email Templates",
  icon: EnvelopeSolid,
})
