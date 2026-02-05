import * as zod from "zod";
import { toast } from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { PostAdminCreateMetaPixel as schema } from "../../api/admin/meta-pixels/validators";
import { MetaPixelFormBase } from "./MetaPixelFormBase";

type FormValues = zod.infer<typeof schema>;

type Props = { onSuccess?: () => void };

export function CreateMetaPixelForm({ onSuccess }: Props) {
  const queryClient = useQueryClient();

  return (
    <MetaPixelFormBase
      schema={schema}
      title="Add Facebook Pixel"
      submitLabel="Save"
      defaultValues={{
        name: "",
        pixel_id: "",
        tracking: "all",
        pages: [],
      }}
      onCancel={onSuccess}
      onSubmit={async (values: FormValues) => {
        try {
          await sdk.client.fetch("/admin/meta-pixels", {
            method: "POST",
            body: values,
          });
          queryClient.invalidateQueries({ queryKey: [["meta-pixels"]] });
          toast.success("Meta Pixel created");
          onSuccess?.();
        } catch (e: any) {
          toast.error(`Failed to create Meta Pixel: ${e.message}`);
        }
      }}
    />
  );
}
