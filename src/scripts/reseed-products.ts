import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createCollectionsWorkflow,
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function reseedProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const productModuleService = container.resolve(Modules.PRODUCT)

  // ── 1. Delete existing products ──────────────────────────────────────────
  logger.info("Deleting existing products...")
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
  })
  if (existingProducts.length) {
    await productModuleService.deleteProducts(existingProducts.map((p) => p.id))
    logger.info(`Deleted ${existingProducts.length} existing products.`)
  }

  // ── 2. Delete existing categories ────────────────────────────────────────
  logger.info("Deleting existing categories...")
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id"],
  })
  if (existingCategories.length) {
    await productModuleService.deleteProductCategories(
      existingCategories.map((c) => c.id)
    )
    logger.info(`Deleted ${existingCategories.length} existing categories.`)
  }

  // ── 2b. Delete existing collections ──────────────────────────────────────
  logger.info("Deleting existing collections...")
  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
  })
  if (existingCollections.length) {
    await (productModuleService as any).deleteCollections(
      existingCollections.map((c) => c.id)
    )
    logger.info(`Deleted ${existingCollections.length} existing collections.`)
  }

  // ── 3. Resolve dependencies ───────────────────────────────────────────────
  const [defaultSalesChannel] =
    await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    })

  const [shippingProfile] =
    await fulfillmentModuleService.listShippingProfiles({ type: "default" })

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  })
  const stockLocation = stockLocations[0]

  // ── 4. Create categories ──────────────────────────────────────────────────
  logger.info("Creating product categories...")
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Smartphones",
          is_active: true,
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80",
          },
        },
        {
          name: "Laptops",
          is_active: true,
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
          },
        },
        {
          name: "Tablets",
          is_active: true,
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
          },
        },
        {
          name: "Accessories",
          is_active: true,
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80",
          },
        },
      ],
    },
  })

  const cat = (name: string) =>
    categoryResult.find((c) => c.name === name)!.id

  // ── 4b. Create collections ────────────────────────────────────────────────
  logger.info("Creating collections...")
  const { result: collectionResult } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        {
          title: "Premium Devices",
          handle: "premium-devices",
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            description: "Top-of-the-line refurbished phones and laptops in excellent condition.",
          },
        },
        {
          title: "Budget Picks",
          handle: "budget-picks",
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80",
            description: "Quality used devices that won't break the bank.",
          },
        },
        {
          title: "Apple Ecosystem",
          handle: "apple-ecosystem",
          metadata: {
            thumbnail: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80",
            description: "iPhones, MacBooks, and iPads — all in one place.",
          },
        },
      ],
    },
  })

  const col = (title: string) =>
    collectionResult.find((c) => c.title === title)!.id

  // ── 5. Create products ────────────────────────────────────────────────────
  logger.info("Creating products...")
  await createProductsWorkflow(container).run({
    input: {
      products: [
        // ── Smartphones ──────────────────────────────────────────────────────
        {
          title: "Apple iPhone 13 Pro (Used)",
          category_ids: [cat("Smartphones")],
          collection_id: col("Premium Devices"),
          description:
            "The iPhone 13 Pro features a Super Retina XDR display with ProMotion, a pro camera system with new Ultra Wide, Wide and Telephoto cameras, and the A15 Bionic chip. All units are inspected, tested, and cleaned. Battery health 85%+.",
          handle: "iphone-13-pro-used",
          weight: 204,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Storage", values: ["128GB", "256GB", "512GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "128GB / Good",      sku: "IP13PRO-128-GOOD", options: { Storage: "128GB", Condition: "Good"      }, prices: [{ amount: 499, currency_code: "eur" }, { amount: 549, currency_code: "usd" }] },
            { title: "128GB / Excellent",  sku: "IP13PRO-128-EXC",  options: { Storage: "128GB", Condition: "Excellent" }, prices: [{ amount: 599, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "256GB / Good",      sku: "IP13PRO-256-GOOD", options: { Storage: "256GB", Condition: "Good"      }, prices: [{ amount: 549, currency_code: "eur" }, { amount: 599, currency_code: "usd" }] },
            { title: "256GB / Excellent",  sku: "IP13PRO-256-EXC",  options: { Storage: "256GB", Condition: "Excellent" }, prices: [{ amount: 649, currency_code: "eur" }, { amount: 699, currency_code: "usd" }] },
            { title: "512GB / Good",      sku: "IP13PRO-512-GOOD", options: { Storage: "512GB", Condition: "Good"      }, prices: [{ amount: 599, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "512GB / Excellent",  sku: "IP13PRO-512-EXC",  options: { Storage: "512GB", Condition: "Excellent" }, prices: [{ amount: 699, currency_code: "eur" }, { amount: 749, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Samsung Galaxy S22 (Used)",
          category_ids: [cat("Smartphones")],
          collection_id: col("Budget Picks"),
          description:
            "The Samsung Galaxy S22 packs a pro-grade camera with Nightography, a powerful Snapdragon 8 Gen 1 processor, and an all-day battery. Each device is fully tested and reset to factory settings. Battery health 85%+.",
          handle: "samsung-galaxy-s22-used",
          weight: 167,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1546027658-7aa750153465?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Storage", values: ["128GB", "256GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "128GB / Good",     sku: "S22-128-GOOD", options: { Storage: "128GB", Condition: "Good"      }, prices: [{ amount: 349, currency_code: "eur" }, { amount: 379, currency_code: "usd" }] },
            { title: "128GB / Excellent", sku: "S22-128-EXC",  options: { Storage: "128GB", Condition: "Excellent" }, prices: [{ amount: 429, currency_code: "eur" }, { amount: 469, currency_code: "usd" }] },
            { title: "256GB / Good",     sku: "S22-256-GOOD", options: { Storage: "256GB", Condition: "Good"      }, prices: [{ amount: 399, currency_code: "eur" }, { amount: 429, currency_code: "usd" }] },
            { title: "256GB / Excellent", sku: "S22-256-EXC",  options: { Storage: "256GB", Condition: "Excellent" }, prices: [{ amount: 479, currency_code: "eur" }, { amount: 519, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Apple iPhone 12 (Used)",
          category_ids: [cat("Smartphones")],
          collection_id: col("Budget Picks"),
          description:
            "The iPhone 12 features a 6.1-inch Super Retina XDR display, 5G capability, and the A14 Bionic chip. A great value option in excellent working condition. Battery health 80%+.",
          handle: "iphone-12-used",
          weight: 164,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Storage", values: ["64GB", "128GB", "256GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "64GB / Good",      sku: "IP12-64-GOOD",  options: { Storage: "64GB",  Condition: "Good"      }, prices: [{ amount: 279, currency_code: "eur" }, { amount: 309, currency_code: "usd" }] },
            { title: "64GB / Excellent",  sku: "IP12-64-EXC",   options: { Storage: "64GB",  Condition: "Excellent" }, prices: [{ amount: 329, currency_code: "eur" }, { amount: 359, currency_code: "usd" }] },
            { title: "128GB / Good",     sku: "IP12-128-GOOD", options: { Storage: "128GB", Condition: "Good"      }, prices: [{ amount: 319, currency_code: "eur" }, { amount: 349, currency_code: "usd" }] },
            { title: "128GB / Excellent", sku: "IP12-128-EXC",  options: { Storage: "128GB", Condition: "Excellent" }, prices: [{ amount: 369, currency_code: "eur" }, { amount: 399, currency_code: "usd" }] },
            { title: "256GB / Good",     sku: "IP12-256-GOOD", options: { Storage: "256GB", Condition: "Good"      }, prices: [{ amount: 359, currency_code: "eur" }, { amount: 389, currency_code: "usd" }] },
            { title: "256GB / Excellent", sku: "IP12-256-EXC",  options: { Storage: "256GB", Condition: "Excellent" }, prices: [{ amount: 409, currency_code: "eur" }, { amount: 449, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        // ── Laptops ───────────────────────────────────────────────────────────
        {
          title: "Apple MacBook Pro 14\" M1 Pro (Used)",
          category_ids: [cat("Laptops")],
          collection_id: col("Premium Devices"),
          description:
            "The MacBook Pro 14\" with M1 Pro chip delivers extraordinary performance with a stunning Liquid Retina XDR display. Fully tested with all ports working. Comes with original charger. Minor cosmetic wear only.",
          handle: "macbook-pro-14-m1-pro-used",
          weight: 1600,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1611186871525-9e4c5b5b7b3e?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["16GB / 512GB", "16GB / 1TB", "32GB / 1TB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "16GB / 512GB / Good",     sku: "MBP14-16-512-GOOD", options: { Configuration: "16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 999,  currency_code: "eur" }, { amount: 1099, currency_code: "usd" }] },
            { title: "16GB / 512GB / Excellent", sku: "MBP14-16-512-EXC",  options: { Configuration: "16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "16GB / 1TB / Good",       sku: "MBP14-16-1T-GOOD",  options: { Configuration: "16GB / 1TB",   Condition: "Good"      }, prices: [{ amount: 1149, currency_code: "eur" }, { amount: 1249, currency_code: "usd" }] },
            { title: "16GB / 1TB / Excellent",   sku: "MBP14-16-1T-EXC",   options: { Configuration: "16GB / 1TB",   Condition: "Excellent" }, prices: [{ amount: 1349, currency_code: "eur" }, { amount: 1449, currency_code: "usd" }] },
            { title: "32GB / 1TB / Good",       sku: "MBP14-32-1T-GOOD",  options: { Configuration: "32GB / 1TB",   Condition: "Good"      }, prices: [{ amount: 1499, currency_code: "eur" }, { amount: 1599, currency_code: "usd" }] },
            { title: "32GB / 1TB / Excellent",   sku: "MBP14-32-1T-EXC",   options: { Configuration: "32GB / 1TB",   Condition: "Excellent" }, prices: [{ amount: 1699, currency_code: "eur" }, { amount: 1849, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Dell XPS 13 (Used)",
          category_ids: [cat("Laptops")],
          collection_id: col("Budget Picks"),
          description:
            "The Dell XPS 13 is a compact powerhouse featuring a stunning InfinityEdge display, Intel Core i5/i7 processor, and all-day battery life. Each unit is data-wiped, tested, and comes with a power adapter.",
          handle: "dell-xps-13-used",
          weight: 1200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 8GB / 256GB", "i5 / 16GB / 512GB", "i7 / 16GB / 512GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "i5 / 8GB / 256GB / Good",     sku: "XPS13-I5-8-256-GOOD",  options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Good"      }, prices: [{ amount: 449, currency_code: "eur" }, { amount: 499, currency_code: "usd" }] },
            { title: "i5 / 8GB / 256GB / Excellent", sku: "XPS13-I5-8-256-EXC",   options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Excellent" }, prices: [{ amount: 549, currency_code: "eur" }, { amount: 599, currency_code: "usd" }] },
            { title: "i5 / 16GB / 512GB / Good",    sku: "XPS13-I5-16-512-GOOD", options: { Configuration: "i5 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 599, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "i5 / 16GB / 512GB / Excellent",sku: "XPS13-I5-16-512-EXC",  options: { Configuration: "i5 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 699, currency_code: "eur" }, { amount: 749, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Good",    sku: "XPS13-I7-16-512-GOOD", options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 699, currency_code: "eur" }, { amount: 769, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Excellent",sku: "XPS13-I7-16-512-EXC",  options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 849, currency_code: "eur" }, { amount: 929, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Lenovo ThinkPad X1 Carbon (Used)",
          category_ids: [cat("Laptops")],
          collection_id: col("Premium Devices"),
          description:
            "The ThinkPad X1 Carbon is the ultimate business ultrabook — incredibly light, durable, and powerful. Intel Core i7, military-grade durability, and an exceptional keyboard. Data wiped, fully tested, includes charger.",
          handle: "lenovo-thinkpad-x1-carbon-used",
          weight: 1130,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 8GB / 256GB", "i7 / 16GB / 512GB", "i7 / 32GB / 1TB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "i5 / 8GB / 256GB / Good",     sku: "X1C-I5-8-256-GOOD",  options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Good"      }, prices: [{ amount: 499,  currency_code: "eur" }, { amount: 549,  currency_code: "usd" }] },
            { title: "i5 / 8GB / 256GB / Excellent", sku: "X1C-I5-8-256-EXC",   options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Excellent" }, prices: [{ amount: 599,  currency_code: "eur" }, { amount: 649,  currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Good",    sku: "X1C-I7-16-512-GOOD", options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 749,  currency_code: "eur" }, { amount: 819,  currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Excellent",sku: "X1C-I7-16-512-EXC",  options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 899,  currency_code: "eur" }, { amount: 979,  currency_code: "usd" }] },
            { title: "i7 / 32GB / 1TB / Good",      sku: "X1C-I7-32-1T-GOOD",  options: { Configuration: "i7 / 32GB / 1TB",   Condition: "Good"      }, prices: [{ amount: 999,  currency_code: "eur" }, { amount: 1099, currency_code: "usd" }] },
            { title: "i7 / 32GB / 1TB / Excellent",  sku: "X1C-I7-32-1T-EXC",   options: { Configuration: "i7 / 32GB / 1TB",   Condition: "Excellent" }, prices: [{ amount: 1149, currency_code: "eur" }, { amount: 1249, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        // ── Tablets ───────────────────────────────────────────────────────────
        {
          title: "Apple iPad Pro 11\" (Used)",
          category_ids: [cat("Tablets")],
          collection_id: col("Apple Ecosystem"),
          description:
            "The iPad Pro 11\" with M1 chip features a Liquid Retina display, Thunderbolt connectivity, and all-day battery life. Compatible with Apple Pencil 2 and Magic Keyboard. Battery health 85%+.",
          handle: "ipad-pro-11-used",
          weight: 466,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Storage", values: ["128GB", "256GB", "512GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "128GB / Good",     sku: "IPADPRO11-128-GOOD", options: { Storage: "128GB", Condition: "Good"      }, prices: [{ amount: 449, currency_code: "eur" }, { amount: 499, currency_code: "usd" }] },
            { title: "128GB / Excellent", sku: "IPADPRO11-128-EXC",  options: { Storage: "128GB", Condition: "Excellent" }, prices: [{ amount: 549, currency_code: "eur" }, { amount: 599, currency_code: "usd" }] },
            { title: "256GB / Good",     sku: "IPADPRO11-256-GOOD", options: { Storage: "256GB", Condition: "Good"      }, prices: [{ amount: 499, currency_code: "eur" }, { amount: 549, currency_code: "usd" }] },
            { title: "256GB / Excellent", sku: "IPADPRO11-256-EXC",  options: { Storage: "256GB", Condition: "Excellent" }, prices: [{ amount: 599, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "512GB / Good",     sku: "IPADPRO11-512-GOOD", options: { Storage: "512GB", Condition: "Good"      }, prices: [{ amount: 599, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "512GB / Excellent", sku: "IPADPRO11-512-EXC",  options: { Storage: "512GB", Condition: "Excellent" }, prices: [{ amount: 699, currency_code: "eur" }, { amount: 769, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        // ── Accessories ───────────────────────────────────────────────────────
        {
          title: "USB-C Charging Cable (1m)",
          category_ids: [cat("Accessories")],
          description:
            "High-quality braided USB-C cable compatible with all USB-C devices including MacBooks, Android phones, and iPads. Supports fast charging up to 100W and data transfer up to 480Mbps.",
          handle: "usb-c-cable-1m",
          weight: 60,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Color", values: ["Black", "White"] },
          ],
          variants: [
            { title: "Black", sku: "USBC-1M-BLACK", options: { Color: "Black" }, prices: [{ amount: 12, currency_code: "eur" }, { amount: 14, currency_code: "usd" }] },
            { title: "White", sku: "USBC-1M-WHITE", options: { Color: "White" }, prices: [{ amount: 12, currency_code: "eur" }, { amount: 14, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  })

  // ── 6. Seed inventory levels ──────────────────────────────────────────────
  logger.info("Seeding inventory levels...")
  const inventoryModuleService = container.resolve(Modules.INVENTORY)

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  for (const item of inventoryItems) {
    const existing = await inventoryModuleService.listInventoryLevels({
      inventory_item_id: item.id,
      location_id: stockLocation.id,
    })
    if (existing.length) {
      await inventoryModuleService.updateInventoryLevels([{
        inventory_item_id: item.id,
        location_id: stockLocation.id,
        stocked_quantity: 50,
      }])
    } else {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [{
            location_id: stockLocation.id,
            stocked_quantity: 50,
            inventory_item_id: item.id,
          }],
        },
      })
    }
  }

  logger.info("Done! Products, categories, and inventory seeded successfully.")
}
