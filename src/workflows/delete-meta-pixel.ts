import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { META_PIXEL_MODULE } from "../modules/meta_pixel";
import MetaPixelModuleService from "../modules/meta_pixel/service";

type DeleteMetaPixelInput = { id: string };

export const deleteMetaPixelStep = createStep(
  "delete-meta-pixel-step",
  async (input: DeleteMetaPixelInput, { container }) => {
    const metaPixelModuleService: MetaPixelModuleService =
      container.resolve(META_PIXEL_MODULE);

    await metaPixelModuleService.deleteMetaPixels(input.id);

    return new StepResponse({ id: input.id });
  },
);

export const deleteMetaPixelWorkflow = createWorkflow(
  "delete-meta-pixel",
  (input: DeleteMetaPixelInput) => {
    const res = deleteMetaPixelStep(input);
    return new WorkflowResponse(res);
  },
);
