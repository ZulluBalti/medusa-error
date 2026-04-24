import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Select, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type Order = {
  id: string
  display_id: number
  email: string
  status: string
  created_at: string
  total: number
  currency_code: string
}

const OrderTagsPage = () => {
  useEffect(() => {
    document.title = "Orders by Tag | Admin"
  }, [])

  const [selectedTag, setSelectedTag] = useState<string>("")

  const { data: tagsData, isLoading: tagsLoading } = useQuery({
    queryKey: ["order-tag-values"],
    queryFn: () => sdk.client.fetch<{ values: string[] }>("/admin/order-tags"),
  })

  const { data: orderIdsData, isLoading: orderIdsLoading } = useQuery({
    queryKey: ["order-tag-orders", selectedTag],
    queryFn: () =>
      sdk.client.fetch<{ order_ids: string[] }>(`/admin/order-tags?value=${encodeURIComponent(selectedTag)}`),
    enabled: !!selectedTag,
  })

  const orderIds = orderIdsData?.order_ids ?? []

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders-by-tag", orderIds],
    queryFn: () =>
      sdk.admin.order.list({ id: orderIds, limit: 100 }),
    enabled: orderIds.length > 0,
  })

  const tagValues = tagsData?.values ?? []
  const orders = ordersData?.orders ?? []
  const isLoadingOrders = orderIdsLoading || ordersLoading

  return (
    <div className="flex flex-col gap-y-4 p-8">
      <div className="flex items-center gap-x-2">
        <Heading>Orders by Tag</Heading>
      </div>

      <Container className="p-6">
        <div className="flex items-center gap-x-4">
          <Text size="small" weight="plus" leading="compact" className="shrink-0">
            Filter by tag
          </Text>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <Select.Trigger className="w-64">
              <Select.Value placeholder="Select a tag..." />
            </Select.Trigger>
            <Select.Content>
              {tagsLoading ? (
                <Select.Item value="__loading" disabled>Loading...</Select.Item>
              ) : tagValues.length === 0 ? (
                <Select.Item value="__empty" disabled>No tags found</Select.Item>
              ) : (
                tagValues.map((v) => (
                  <Select.Item key={v} value={v}>{v}</Select.Item>
                ))
              )}
            </Select.Content>
          </Select>
          {selectedTag && (
            <Button size="small" variant="transparent" onClick={() => setSelectedTag("")}>
              Clear
            </Button>
          )}
        </div>
      </Container>

      {selectedTag && (
        <Container className="p-0">
          {isLoadingOrders ? (
            <div className="p-6">
              <Text size="small" className="text-ui-fg-subtle">Loading orders...</Text>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6">
              <Text size="small" className="text-ui-fg-subtle">No orders found with tag "{selectedTag}"</Text>
            </div>
          ) : (
            <>
              <div className="border-b border-ui-border-base px-6 py-3">
                <Text size="small" className="text-ui-fg-subtle">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} with tag
                  <Badge size="2xsmall" className="ml-2">{selectedTag}</Badge>
                </Text>
              </div>
              <div className="divide-y divide-ui-border-base">
                {orders.map((order: Order) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex flex-col gap-y-0.5">
                      <Text size="small" weight="plus" leading="compact">
                        #{order.display_id}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle" leading="compact">
                        {order.email}
                      </Text>
                    </div>
                    <div className="flex items-center gap-x-4">
                      <Badge size="2xsmall" color={order.status === "completed" ? "green" : "grey"}>
                        {order.status}
                      </Badge>
                      <Text size="small" weight="plus">
                        {order.total} {order.currency_code?.toUpperCase()}
                      </Text>
                      <Link to={`/orders/${order.id}`}>
                        <Button size="small" variant="secondary">View</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Container>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Order Tags",
  icon: Tag,
})

export default OrderTagsPage
