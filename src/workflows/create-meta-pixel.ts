import { createStep, StepResponse,  createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import {  META_PIXEL_MODULE } from "../modules/meta_pixel";
import MetaPixelModuleService from "../modules/meta_pixel/service";
import { CreateMetaPixelStepInput } from "../api/admin/meta-pixels/validators";

export const createMetaPixelStep = createStep(
  "create-meta-pixel-step",
  async (input: CreateMetaPixelStepInput, { container }) => {
    const metaPixelModuleService: MetaPixelModuleService =
      container.resolve(META_PIXEL_MODULE);

    const metaPixel = await metaPixelModuleService.createMetaPixels(input);

    return new StepResponse(metaPixel, metaPixel.id);
  },
  async (id: string, { container }) => {
    const metaPixelModuleService: MetaPixelModuleService =
      container.resolve(META_PIXEL_MODULE);

    await metaPixelModuleService.deleteMetaPixels(id);
  },
);

export const createMetaPixelWorkflow = createWorkflow(
  "create-meta-pixel",
  (input: CreateMetaPixelStepInput) => {
    const metaPixel = createMetaPixelStep(input)

    return new WorkflowResponse(metaPixel)
  }
)
