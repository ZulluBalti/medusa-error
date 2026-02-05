import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { updateMetaPixelStatusWorkflow } from "../../../../../workflows/update-meta-pixel-status";
import { PostAdminUpdateMetaPixelStatusType } from "./validators";

export const POST = async (
  req: MedusaRequest<PostAdminUpdateMetaPixelStatusType>,
  res: MedusaResponse,
) => {
  const { id } = req.params as { id: string };
  const { is_active } = req.validatedBody;

  const { result } = await updateMetaPixelStatusWorkflow(req.scope).run({
    input: { id, is_active },
  });

  res.json({ meta_pixel: result });
};
