import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { META_PIXEL_MODULE } from "../modules/meta_pixel";
import MetaPixelModuleService from "../modules/meta_pixel/service";

export type UpdateMetaPixelStatusInput = {
  id: string;
  is_active: boolean;
};

export const updateMetaPixelStatusStep = createStep(
  "update-meta-pixel-status-step",
  async (input: UpdateMetaPixelStatusInput, { container }) => {
    const metaPixelModuleService: MetaPixelModuleService =
      container.resolve(META_PIXEL_MODULE);

    const updated = await metaPixelModuleService.updateMetaPixels({
      selector: { id: input.id },
      data: { is_active: input.is_active },
    });

    return new StepResponse(updated);
  },
);

export const updateMetaPixelStatusWorkflow = createWorkflow(
  "update-meta-pixel-status",
  (input: UpdateMetaPixelStatusInput) => {
    const updated = updateMetaPixelStatusStep(input);
    return new WorkflowResponse(updated);
  },
);
