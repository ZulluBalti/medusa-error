import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createMetaPixelWorkflow } from "../../../workflows/create-meta-pixel";
import { CreateMetaPixelStepInput  } from "./validators";

export const POST = async (
  req: MedusaRequest<CreateMetaPixelStepInput>,
  res: MedusaResponse,
) => {
  const { result } = await createMetaPixelWorkflow(req.scope).run({
    input: req.validatedBody,
  });

  res.json({ meta_pixel: result });
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query");

  const { data: meta_pixels, metadata: { count, take, skip } = {} } =
    await query.graph({
      entity: "meta_pixel",
      ...req.queryConfig,
    });

  res.json({
    meta_pixels,
    count,
    limit: take,
    offset: skip,
  });
};
