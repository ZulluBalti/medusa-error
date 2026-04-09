import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_locales: [
          {
            locale_code: "fr-FR"
          },
          {
            locale_code: "es-ES"
          }
        ]
      },
    },
  });
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "eur",
          is_default: true,
        },
        {
          currency_code: "usd",
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Europe",
          currency_code: "eur",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "European Warehouse",
          address: {
            city: "Copenhagen",
            country_code: "DK",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "European Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Europe",
        geo_zones: [
          {
            country_code: "gb",
            type: "country",
          },
          {
            country_code: "de",
            type: "country",
          },
          {
            country_code: "dk",
            type: "country",
          },
          {
            country_code: "se",
            type: "country",
          },
          {
            country_code: "fr",
            type: "country",
          },
          {
            country_code: "es",
            type: "country",
          },
          {
            country_code: "it",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Webshop",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });
  const publishableApiKey = publishableApiKeyResult[0];

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Smartphones",
          is_active: true,
        },
        {
          name: "Laptops",
          is_active: true,
        },
        {
          name: "Tablets",
          is_active: true,
        },
        {
          name: "Accessories",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Apple iPhone 13 Pro (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Smartphones")!.id,
          ],
          description:
            "The iPhone 13 Pro features a Super Retina XDR display with ProMotion, a pro camera system with new Ultra Wide, Wide and Telephoto cameras, and the A15 Bionic chip. All units are inspected, tested, and cleaned. Battery health 85%+.",
          handle: "iphone-13-pro-used",
          weight: 204,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Storage",
              values: ["128GB", "256GB", "512GB"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "128GB / Good",
              sku: "IP13PRO-128-GOOD",
              options: { Storage: "128GB", Condition: "Good" },
              prices: [
                { amount: 499, currency_code: "eur" },
                { amount: 549, currency_code: "usd" },
              ],
            },
            {
              title: "128GB / Excellent",
              sku: "IP13PRO-128-EXC",
              options: { Storage: "128GB", Condition: "Excellent" },
              prices: [
                { amount: 599, currency_code: "eur" },
                { amount: 649, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Good",
              sku: "IP13PRO-256-GOOD",
              options: { Storage: "256GB", Condition: "Good" },
              prices: [
                { amount: 549, currency_code: "eur" },
                { amount: 599, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Excellent",
              sku: "IP13PRO-256-EXC",
              options: { Storage: "256GB", Condition: "Excellent" },
              prices: [
                { amount: 649, currency_code: "eur" },
                { amount: 699, currency_code: "usd" },
              ],
            },
            {
              title: "512GB / Good",
              sku: "IP13PRO-512-GOOD",
              options: { Storage: "512GB", Condition: "Good" },
              prices: [
                { amount: 599, currency_code: "eur" },
                { amount: 649, currency_code: "usd" },
              ],
            },
            {
              title: "512GB / Excellent",
              sku: "IP13PRO-512-EXC",
              options: { Storage: "512GB", Condition: "Excellent" },
              prices: [
                { amount: 699, currency_code: "eur" },
                { amount: 749, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Samsung Galaxy S22 (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Smartphones")!.id,
          ],
          description:
            "The Samsung Galaxy S22 packs a pro-grade camera with Nightography, a powerful Snapdragon 8 Gen 1 processor, and an all-day battery. Each device is fully tested and reset to factory settings. Battery health 85%+.",
          handle: "samsung-galaxy-s22-used",
          weight: 167,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1546027658-7aa750153465?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Storage",
              values: ["128GB", "256GB"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "128GB / Good",
              sku: "S22-128-GOOD",
              options: { Storage: "128GB", Condition: "Good" },
              prices: [
                { amount: 349, currency_code: "eur" },
                { amount: 379, currency_code: "usd" },
              ],
            },
            {
              title: "128GB / Excellent",
              sku: "S22-128-EXC",
              options: { Storage: "128GB", Condition: "Excellent" },
              prices: [
                { amount: 429, currency_code: "eur" },
                { amount: 469, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Good",
              sku: "S22-256-GOOD",
              options: { Storage: "256GB", Condition: "Good" },
              prices: [
                { amount: 399, currency_code: "eur" },
                { amount: 429, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Excellent",
              sku: "S22-256-EXC",
              options: { Storage: "256GB", Condition: "Excellent" },
              prices: [
                { amount: 479, currency_code: "eur" },
                { amount: 519, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apple iPhone 12 (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Smartphones")!.id,
          ],
          description:
            "The iPhone 12 features a 6.1-inch Super Retina XDR display, 5G capability, and the A14 Bionic chip. A great value option in excellent working condition. Battery health 80%+.",
          handle: "iphone-12-used",
          weight: 164,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Storage",
              values: ["64GB", "128GB", "256GB"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "64GB / Good",
              sku: "IP12-64-GOOD",
              options: { Storage: "64GB", Condition: "Good" },
              prices: [
                { amount: 279, currency_code: "eur" },
                { amount: 309, currency_code: "usd" },
              ],
            },
            {
              title: "64GB / Excellent",
              sku: "IP12-64-EXC",
              options: { Storage: "64GB", Condition: "Excellent" },
              prices: [
                { amount: 329, currency_code: "eur" },
                { amount: 359, currency_code: "usd" },
              ],
            },
            {
              title: "128GB / Good",
              sku: "IP12-128-GOOD",
              options: { Storage: "128GB", Condition: "Good" },
              prices: [
                { amount: 319, currency_code: "eur" },
                { amount: 349, currency_code: "usd" },
              ],
            },
            {
              title: "128GB / Excellent",
              sku: "IP12-128-EXC",
              options: { Storage: "128GB", Condition: "Excellent" },
              prices: [
                { amount: 369, currency_code: "eur" },
                { amount: 399, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Good",
              sku: "IP12-256-GOOD",
              options: { Storage: "256GB", Condition: "Good" },
              prices: [
                { amount: 359, currency_code: "eur" },
                { amount: 389, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Excellent",
              sku: "IP12-256-EXC",
              options: { Storage: "256GB", Condition: "Excellent" },
              prices: [
                { amount: 409, currency_code: "eur" },
                { amount: 449, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apple MacBook Pro 14\" M1 Pro (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Laptops")!.id,
          ],
          description:
            "The MacBook Pro 14\" with M1 Pro chip delivers extraordinary performance with a stunning Liquid Retina XDR display. Fully tested with all ports working. Comes with original charger. Minor cosmetic wear only.",
          handle: "macbook-pro-14-m1-pro-used",
          weight: 1600,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1611186871525-9e4c5b5b7b3e?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Configuration",
              values: ["16GB RAM / 512GB SSD", "16GB RAM / 1TB SSD", "32GB RAM / 1TB SSD"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "16GB / 512GB / Good",
              sku: "MBP14-16-512-GOOD",
              options: { Configuration: "16GB RAM / 512GB SSD", Condition: "Good" },
              prices: [
                { amount: 999, currency_code: "eur" },
                { amount: 1099, currency_code: "usd" },
              ],
            },
            {
              title: "16GB / 512GB / Excellent",
              sku: "MBP14-16-512-EXC",
              options: { Configuration: "16GB RAM / 512GB SSD", Condition: "Excellent" },
              prices: [
                { amount: 1199, currency_code: "eur" },
                { amount: 1299, currency_code: "usd" },
              ],
            },
            {
              title: "16GB / 1TB / Good",
              sku: "MBP14-16-1T-GOOD",
              options: { Configuration: "16GB RAM / 1TB SSD", Condition: "Good" },
              prices: [
                { amount: 1149, currency_code: "eur" },
                { amount: 1249, currency_code: "usd" },
              ],
            },
            {
              title: "16GB / 1TB / Excellent",
              sku: "MBP14-16-1T-EXC",
              options: { Configuration: "16GB RAM / 1TB SSD", Condition: "Excellent" },
              prices: [
                { amount: 1349, currency_code: "eur" },
                { amount: 1449, currency_code: "usd" },
              ],
            },
            {
              title: "32GB / 1TB / Good",
              sku: "MBP14-32-1T-GOOD",
              options: { Configuration: "32GB RAM / 1TB SSD", Condition: "Good" },
              prices: [
                { amount: 1499, currency_code: "eur" },
                { amount: 1599, currency_code: "usd" },
              ],
            },
            {
              title: "32GB / 1TB / Excellent",
              sku: "MBP14-32-1T-EXC",
              options: { Configuration: "32GB RAM / 1TB SSD", Condition: "Excellent" },
              prices: [
                { amount: 1699, currency_code: "eur" },
                { amount: 1849, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Dell XPS 13 (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Laptops")!.id,
          ],
          description:
            "The Dell XPS 13 is a compact powerhouse featuring a stunning InfinityEdge display, Intel Core i5/i7 processor, and all-day battery life. Each unit is data-wiped, tested, and comes with a power adapter.",
          handle: "dell-xps-13-used",
          weight: 1200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
            },
            {
              url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Configuration",
              values: ["i5 / 8GB / 256GB", "i5 / 16GB / 512GB", "i7 / 16GB / 512GB"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "i5 / 8GB / 256GB / Good",
              sku: "XPS13-I5-8-256-GOOD",
              options: { Configuration: "i5 / 8GB / 256GB", Condition: "Good" },
              prices: [
                { amount: 449, currency_code: "eur" },
                { amount: 499, currency_code: "usd" },
              ],
            },
            {
              title: "i5 / 8GB / 256GB / Excellent",
              sku: "XPS13-I5-8-256-EXC",
              options: { Configuration: "i5 / 8GB / 256GB", Condition: "Excellent" },
              prices: [
                { amount: 549, currency_code: "eur" },
                { amount: 599, currency_code: "usd" },
              ],
            },
            {
              title: "i5 / 16GB / 512GB / Good",
              sku: "XPS13-I5-16-512-GOOD",
              options: { Configuration: "i5 / 16GB / 512GB", Condition: "Good" },
              prices: [
                { amount: 599, currency_code: "eur" },
                { amount: 649, currency_code: "usd" },
              ],
            },
            {
              title: "i5 / 16GB / 512GB / Excellent",
              sku: "XPS13-I5-16-512-EXC",
              options: { Configuration: "i5 / 16GB / 512GB", Condition: "Excellent" },
              prices: [
                { amount: 699, currency_code: "eur" },
                { amount: 749, currency_code: "usd" },
              ],
            },
            {
              title: "i7 / 16GB / 512GB / Good",
              sku: "XPS13-I7-16-512-GOOD",
              options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good" },
              prices: [
                { amount: 699, currency_code: "eur" },
                { amount: 769, currency_code: "usd" },
              ],
            },
            {
              title: "i7 / 16GB / 512GB / Excellent",
              sku: "XPS13-I7-16-512-EXC",
              options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" },
              prices: [
                { amount: 849, currency_code: "eur" },
                { amount: 929, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Lenovo ThinkPad X1 Carbon (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Laptops")!.id,
          ],
          description:
            "The ThinkPad X1 Carbon is the ultimate business ultrabook — incredibly light, durable, and powerful. Intel Core i7, military-grade durability, and an exceptional keyboard. Data wiped, fully tested, includes charger.",
          handle: "lenovo-thinkpad-x1-carbon-used",
          weight: 1130,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Configuration",
              values: ["i5 / 8GB / 256GB", "i7 / 16GB / 512GB", "i7 / 32GB / 1TB"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "i5 / 8GB / 256GB / Good",
              sku: "X1C-I5-8-256-GOOD",
              options: { Configuration: "i5 / 8GB / 256GB", Condition: "Good" },
              prices: [
                { amount: 499, currency_code: "eur" },
                { amount: 549, currency_code: "usd" },
              ],
            },
            {
              title: "i5 / 8GB / 256GB / Excellent",
              sku: "X1C-I5-8-256-EXC",
              options: { Configuration: "i5 / 8GB / 256GB", Condition: "Excellent" },
              prices: [
                { amount: 599, currency_code: "eur" },
                { amount: 649, currency_code: "usd" },
              ],
            },
            {
              title: "i7 / 16GB / 512GB / Good",
              sku: "X1C-I7-16-512-GOOD",
              options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good" },
              prices: [
                { amount: 749, currency_code: "eur" },
                { amount: 819, currency_code: "usd" },
              ],
            },
            {
              title: "i7 / 16GB / 512GB / Excellent",
              sku: "X1C-I7-16-512-EXC",
              options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" },
              prices: [
                { amount: 899, currency_code: "eur" },
                { amount: 979, currency_code: "usd" },
              ],
            },
            {
              title: "i7 / 32GB / 1TB / Good",
              sku: "X1C-I7-32-1T-GOOD",
              options: { Configuration: "i7 / 32GB / 1TB", Condition: "Good" },
              prices: [
                { amount: 999, currency_code: "eur" },
                { amount: 1099, currency_code: "usd" },
              ],
            },
            {
              title: "i7 / 32GB / 1TB / Excellent",
              sku: "X1C-I7-32-1T-EXC",
              options: { Configuration: "i7 / 32GB / 1TB", Condition: "Excellent" },
              prices: [
                { amount: 1149, currency_code: "eur" },
                { amount: 1249, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apple iPad Pro 11\" (Used)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Tablets")!.id,
          ],
          description:
            "The iPad Pro 11\" with M1 chip features a Liquid Retina display, Thunderbolt connectivity, and all-day battery life. Compatible with Apple Pencil 2 and Magic Keyboard. Battery health 85%+.",
          handle: "ipad-pro-11-used",
          weight: 466,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Storage",
              values: ["128GB", "256GB", "512GB"],
            },
            {
              title: "Condition",
              values: ["Good", "Excellent"],
            },
          ],
          variants: [
            {
              title: "128GB / Good",
              sku: "IPADPRO11-128-GOOD",
              options: { Storage: "128GB", Condition: "Good" },
              prices: [
                { amount: 449, currency_code: "eur" },
                { amount: 499, currency_code: "usd" },
              ],
            },
            {
              title: "128GB / Excellent",
              sku: "IPADPRO11-128-EXC",
              options: { Storage: "128GB", Condition: "Excellent" },
              prices: [
                { amount: 549, currency_code: "eur" },
                { amount: 599, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Good",
              sku: "IPADPRO11-256-GOOD",
              options: { Storage: "256GB", Condition: "Good" },
              prices: [
                { amount: 499, currency_code: "eur" },
                { amount: 549, currency_code: "usd" },
              ],
            },
            {
              title: "256GB / Excellent",
              sku: "IPADPRO11-256-EXC",
              options: { Storage: "256GB", Condition: "Excellent" },
              prices: [
                { amount: 599, currency_code: "eur" },
                { amount: 649, currency_code: "usd" },
              ],
            },
            {
              title: "512GB / Good",
              sku: "IPADPRO11-512-GOOD",
              options: { Storage: "512GB", Condition: "Good" },
              prices: [
                { amount: 599, currency_code: "eur" },
                { amount: 649, currency_code: "usd" },
              ],
            },
            {
              title: "512GB / Excellent",
              sku: "IPADPRO11-512-EXC",
              options: { Storage: "512GB", Condition: "Excellent" },
              prices: [
                { amount: 699, currency_code: "eur" },
                { amount: 769, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "USB-C Charging Cable (1m)",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Accessories")!.id,
          ],
          description:
            "High-quality braided USB-C cable compatible with all USB-C devices including MacBooks, Android phones, and iPads. Supports fast charging up to 100W and data transfer up to 480Mbps.",
          handle: "usb-c-cable-1m",
          weight: 60,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
            },
          ],
          options: [
            {
              title: "Color",
              values: ["Black", "White"],
            },
          ],
          variants: [
            {
              title: "Black",
              sku: "USBC-CABLE-1M-BLACK",
              options: { Color: "Black" },
              prices: [
                { amount: 12, currency_code: "eur" },
                { amount: 14, currency_code: "usd" },
              ],
            },
            {
              title: "White",
              sku: "USBC-CABLE-1M-WHITE",
              options: { Color: "White" },
              prices: [
                { amount: 12, currency_code: "eur" },
                { amount: 14, currency_code: "usd" },
              ],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
