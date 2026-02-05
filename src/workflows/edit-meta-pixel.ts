import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { META_PIXEL_MODULE } from "../modules/meta_pixel";
import MetaPixelModuleService from "../modules/meta_pixel/service";
import { EditMetaPixelStepInput } from "../api/admin/meta-pixels/validators";

export const editMetaPixelStep = createStep(
  "edit-meta-pixel-step",
  async (input: EditMetaPixelStepInput, { container }) => {
    const metaPixelModuleService: MetaPixelModuleService =
      container.resolve(META_PIXEL_MODULE);

    const updated = await metaPixelModuleService.updateMetaPixels({
      selector: { id: input.id },
      data: {
        pixel_id: input.pixel_id,
        pages: input.pages,
        name: input.name,
        tracking: input.tracking,
      },
    });

    return new StepResponse(updated);
  },
);

export const editMetaPixelWorkflow = createWorkflow(
  "edit-meta-pixel",
  (input: EditMetaPixelStepInput) => {
    const updated = editMetaPixelStep(input);
    return new WorkflowResponse(updated);
  },
);
