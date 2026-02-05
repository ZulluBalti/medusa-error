import * as zod from "zod";
import { toast } from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";
import { PostAdminCreateMetaPixel as schema } from "../../api/admin/meta-pixels/validators";
import { MetaPixelFormBase } from "./MetaPixelFormBase";

type FormValues = zod.infer<typeof schema>;

type Props = {
  metaPixelId: string;
  initialValues: any;
  onSuccess?: () => void;
};

export function EditMetaPixelForm({
  metaPixelId,
  initialValues,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();

  return (
    <MetaPixelFormBase
      schema={schema}
      title="Edit Facebook Pixel"
      submitLabel="Save changes"
      defaultValues={{
        ...initialValues,
        pages: initialValues.pages?.join?.("\n"),
      }}
      onCancel={onSuccess}
      onSubmit={async (values: FormValues) => {
        try {
          await sdk.client.fetch(`/admin/meta-pixels/${metaPixelId}`, {
            method: "PUT",
            body: values,
          });
          queryClient.invalidateQueries({ queryKey: [["meta-pixels"]] });
          toast.success("Meta Pixel updated");
          onSuccess?.();
        } catch (e: any) {
          toast.error(`Failed to update Meta Pixel: ${e.message}`);
        }
      }}
    />
  );
}
