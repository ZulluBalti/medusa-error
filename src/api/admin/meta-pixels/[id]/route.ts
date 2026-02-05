import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { deleteMetaPixelWorkflow } from "../../../../workflows/delete-meta-pixel";
import { editMetaPixelWorkflow } from "../../../../workflows/edit-meta-pixel";
import { CreateMetaPixelStepInput } from "../validators";

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params as { id: string };

  await deleteMetaPixelWorkflow(req.scope).run({ input: { id } });

  res.json({
    id,
    object: "meta_pixel",
    deleted: true,
  });
};

export const PUT = async (
  req: MedusaRequest<CreateMetaPixelStepInput>,
  res: MedusaResponse,
) => {
  const { id } = req.params as { id: string };

  const input = { id, ...req.validatedBody };

  const { result } = await editMetaPixelWorkflow(req.scope).run({ input });

  res.json({
    meta_pixel: result,
  });
};
