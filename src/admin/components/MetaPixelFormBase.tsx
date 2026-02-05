import React from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Heading,
  Input,
  Label,
  RadioGroup,
  Textarea,
  Text,
  Tooltip,
} from "@medusajs/ui";

type Tracking = "all" | "selected" | "excluded";

type MetaPixelFormBaseProps<TSchema extends zod.ZodTypeAny> = {
  schema: TSchema;
  defaultValues: zod.infer<TSchema>;
  title: string;
  submitLabel?: string;
  onCancel?: () => void;
  onSubmit: (values: zod.infer<TSchema>) => Promise<void> | void;
  footer?: React.ReactNode;
};

export function MetaPixelFormBase<TSchema extends zod.ZodTypeAny>({
  schema,
  defaultValues,
  title,
  submitLabel = "Save",
  onCancel,
  onSubmit,
  footer,
}: MetaPixelFormBaseProps<TSchema>) {
  type FormValues = zod.infer<TSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const tracking = useWatch({
    control: form.control,
    name: "tracking" as any,
  }) as Tracking | undefined;
  const name = useWatch({ control: form.control, name: "name" as any }) as
    | string
    | undefined;
  const pixelId = useWatch({
    control: form.control,
    name: "pixel_id" as any,
  }) as string | undefined;

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-6 px-2 py-4">
            <div>
              <Heading level="h1">{title}</Heading>
            </div>

            {/* Name */}
            <Controller
              control={form.control}
              name={"name" as any}
              render={({ field, fieldState }) => (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Label size="small" weight="plus">
                      Name your pixel{" "}
                      <span className="text-ui-fg-error">*</span>
                    </Label>
                    <Text
                      size="xsmall"
                      className="text-ui-fg-subtle tabular-nums"
                    >
                      {name?.length ?? 0}/255
                    </Text>
                  </div>
                  <Input
                    {...field}
                    placeholder="Any name will do. This is just so you can manage different pixels easily."
                  />
                  {fieldState.error?.message ? (
                    <Text size="xsmall" className="text-ui-fg-error">
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </div>
              )}
            />

            {/* Pixel ID */}
            <Controller
              control={form.control}
              name={"pixel_id" as any}
              render={({ field, fieldState }) => (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                      <Label size="small" weight="plus">
                        Pixel ID <span className="text-ui-fg-error">*</span>
                      </Label>
                      <a
                        className="text-ui-fg-interactive text-xs underline underline-offset-2"
                        href="https://www.facebook.com/business/help/952192354843755"
                        target="_blank"
                        rel="noreferrer"
                      >
                        How I get it?
                      </a>
                    </div>
                    <Text
                      size="xsmall"
                      className="text-ui-fg-subtle tabular-nums"
                    >
                      {pixelId?.length ?? 0}/17
                    </Text>
                  </div>

                  <Input
                    {...field}
                    placeholder="Copy pixel ID from Facebook and paste here."
                  />

                  {fieldState.error?.message ? (
                    <Text size="xsmall" className="text-ui-fg-error">
                      {fieldState.error.message}
                    </Text>
                  ) : null}
                </div>
              )}
            />

            {/* Tracking */}
            <div className="flex flex-col space-y-2">
              <Label size="small" weight="plus">
                Tracking on pages
              </Label>

              <Controller
                control={form.control}
                name={"tracking" as any}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <div className="flex flex-col gap-y-2">
                      <div className="flex items-center gap-x-2">
                        <RadioGroup.Item value="all" id="tracking-all" />
                        <Label htmlFor="tracking-all" size="small">
                          All pages
                        </Label>
                      </div>

                      <div className="flex items-center gap-x-2">
                        <RadioGroup.Item
                          value="selected"
                          id="tracking-selected"
                        />
                        <Label htmlFor="tracking-selected" size="small">
                          Selected pages
                        </Label>
                      </div>

                      <div className="flex items-center gap-x-2">
                        <RadioGroup.Item
                          value="excluded"
                          id="tracking-excluded"
                        />
                        <Label htmlFor="tracking-excluded" size="small">
                          Excluded pages
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                )}
              />

              {(tracking === "selected" || tracking === "excluded") && (
                <Controller
                  control={form.control}
                  name={"pages" as any}
                  render={({ field, fieldState }) => (
                    <div className="mt-2 flex flex-col space-y-2">
                      <div className="flex items-center gap-x-2">
                        <Text size="small" className="text-ui-fg-subtle">
                          Add page paths (one per line)
                        </Text>
                        <Tooltip content="Examples: /products/*, /cart, /collections/sale">
                          <span className="text-ui-fg-subtle text-xs cursor-help">
                            ?
                          </span>
                        </Tooltip>
                      </div>

                      <Textarea
                        value={field.value as any}
                        onChange={(e) => field.onChange(e.currentTarget.value)}
                        placeholder={"/\n/products/*\n/cart"}
                        rows={4}
                      />

                      {fieldState.error?.message ? (
                        <Text size="xsmall" className="text-ui-fg-error">
                          {fieldState.error.message}
                        </Text>
                      ) : null}
                    </div>
                  )}
                />
              )}
            </div>

            {footer ? <div>{footer}</div> : null}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-end gap-x-2">
          <Button
            type="button"
            size="small"
            variant="secondary"
            onClick={() => onCancel?.()}
          >
            Cancel
          </Button>
          <Button type="submit" size="small" disabled={!form.formState.isValid}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
