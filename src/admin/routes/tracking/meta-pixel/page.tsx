import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  Container,
  Heading,
  Button,
  DataTable,
  createDataTableColumnHelper,
  DataTablePaginationState,
  useDataTable,
  Drawer,
  Switch,
  DropdownMenu,
  IconButton,
  toast,
} from "@medusajs/ui";
import { EllipsisHorizontal } from "@medusajs/icons";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { sdk } from "../../../lib/sdk";
import { CreateMetaPixelForm } from "../../../components/CreateMetaPixelForm";
import { EditMetaPixelForm } from "../../../components/EditMetaPixelForm";
import { Badge } from "@medusajs/ui";

type MetaPixel = {
  id: string;
  name: string;
  pixel_id: string;
  created_at: string;
  tracking: string;
  pages: string;
  is_active: boolean;
};

type MetaPixelListResponse = {
  meta_pixels: MetaPixel[];
  count: number;
  limit: number;
  offset: number;
};

const columnHelper = createDataTableColumnHelper<MetaPixel>();
const limit = 15;

const MetaPixelPage = () => {
  const queryClient = useQueryClient();

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });

  const [openCreate, setOpenCreate] = useState(false);

  // OPTIONAL: for edit drawer
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<MetaPixel | null>(null);

  const offset = useMemo(() => pagination.pageIndex * limit, [pagination]);

  const queryKey = useMemo(() => ["meta-pixels", limit, offset], [offset]);

  const { data, isLoading } = useQuery({
    queryFn: () =>
      sdk.client.fetch<MetaPixelListResponse>("/admin/meta-pixels", {
        method: "GET",
        query: { limit, offset },
      }),
    queryKey: [queryKey],
  });

  // --- Toggle active/inactive ---
  const toggleMutation = useMutation({
    mutationFn: async (params: { id: string; is_active: boolean }) => {
      return sdk.client.fetch(`/admin/meta-pixels/${params.id}/toggle`, {
        method: "POST",
        body: { is_active: params.is_active },
      });
    },
    onMutate: async ({ id, is_active }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: [queryKey] });
      const prev = queryClient.getQueryData<{
        meta_pixels: MetaPixel[];
        count: number;
        limit: number;
        offset: number;
      }>([queryKey]);

      if (prev) {
        queryClient.setQueryData([queryKey], {
          ...prev,
          meta_pixels: prev.meta_pixels.map((p) =>
            p.id === id ? { ...p, is_active } : p,
          ),
        });
      }

      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([queryKey], ctx.prev);
      toast.error("Failed to update status");
    },
    onSuccess: () => {
      toast.success("Status updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  // --- Delete ---
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return sdk.client.fetch(`/admin/meta-pixels/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Pixel deleted");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: () => {
      toast.error("Failed to delete pixel");
    },
  });

  const columns = useMemo(
    () => [
      // Existing Status text column (optional; you can keep or remove)
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: ({ getValue }) => {
          const active = getValue();

          return (
            <Badge color={active ? "green" : "grey"} size="small">
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      }),

      // NEW: Toggle column (switch)
      columnHelper.display({
        id: "toggle",
        header: "",
        cell: ({ row }) => {
          const pixel = row.original;
          const isBusy = toggleMutation.isPending;

          return (
            <Switch
              checked={pixel.is_active}
              disabled={isBusy}
              className="data-[state=checked]:bg-orange-300 data-[state=checked]:hover:bg-orange-400 data-[state=unchecked]:bg-ui-bg-gray-100"
              onCheckedChange={(checked) => {
                toggleMutation.mutate({ id: pixel.id, is_active: checked });
              }}
            />
          );
        },
      }),

      columnHelper.accessor("name", { header: "Name" }),
      columnHelper.accessor("pixel_id", { header: "Pixel ID" }),
      columnHelper.accessor("tracking", { header: "Tracking" }),

      columnHelper.accessor("created_at", {
        header: "Created At",
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? new Date(value).toLocaleString() : "-";
        },
      }),

      // NEW: Actions column (menu)
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const pixel = row.original;
          const isDeleting = deleteMutation.isPending;

          return (
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <IconButton size="small" variant="transparent">
                  <EllipsisHorizontal />
                </IconButton>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  onClick={() => {
                    setEditing(pixel);
                    setOpenEdit(true);
                  }}
                >
                  Edit
                </DropdownMenu.Item>

                <DropdownMenu.Separator />

                <DropdownMenu.Item
                  disabled={isDeleting}
                  onClick={() => {
                    // Basic confirm; replace with your own modal if desired
                    const ok = window.confirm(`Delete "${pixel.name}"?`);
                    if (ok) deleteMutation.mutate(pixel.id);
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          );
        },
      }),
    ],
    [toggleMutation.isPending, deleteMutation.isPending],
  );

  const table = useDataTable({
    columns,
    data: data?.meta_pixels || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-center justify-between px-6 py-4">
          <Heading level="h1">Meta Pixels</Heading>

          {/* Create drawer */}
          <Drawer open={openCreate} onOpenChange={setOpenCreate}>
            <Drawer.Trigger asChild>
              <Button size="small" onClick={() => setOpenCreate(true)}>
                Add Pixel
              </Button>
            </Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>Create Meta Pixel</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <CreateMetaPixelForm
                  onSuccess={() => {
                    setOpenCreate(false);
                    // list is re-fetched via invalidateQueries in the form
                  }}
                />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer>
        </DataTable.Toolbar>

        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* OPTIONAL: Edit drawer */}
      <Drawer open={openEdit} onOpenChange={setOpenEdit}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Meta Pixel</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            {editing ? (
              <div>
                <EditMetaPixelForm
                  metaPixelId={editing.id}
                  initialValues={editing}
                  onSuccess={() => {
                    setOpenEdit(false);
                    setEditing(null);
                    queryClient.invalidateQueries({ queryKey: [queryKey] });
                  }}
                />
                <div className="text-ui-fg-subtle">
                  Implement an edit form here (editing: {editing.name})
                </div>
              </div>
            ) : null}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Meta Pixel",
});

export default MetaPixelPage;
