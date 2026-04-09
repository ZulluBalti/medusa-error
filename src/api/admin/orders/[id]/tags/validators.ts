import { z } from "zod"

export const AddOrderTagSchema = z.object({
  value: z.string().min(1).max(100),
})

export type AddOrderTagInput = z.infer<typeof AddOrderTagSchema>
