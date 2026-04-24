import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

const SEED_FLAG = "laptop_shop_seeded_v1"

export default async function laptopShopSeed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const productModuleService = container.resolve(Modules.PRODUCT)
  const orderModuleService = container.resolve(Modules.ORDER)
  const storeModuleService = container.resolve(Modules.STORE)
  const inventoryModuleService = container.resolve(Modules.INVENTORY)

  // ── 0. One-time guard (store metadata) ───────────────────────────────────
  const [store] = await storeModuleService.listStores()
  if (store?.metadata?.[SEED_FLAG]) {
    logger.warn(
      `Laptop shop seed already ran (${SEED_FLAG}). Aborting to prevent duplicate run. ` +
        `If you really want to run it again, remove the "${SEED_FLAG}" key from the store metadata.`
    )
    return
  }

  // ── 1. Delete existing orders ────────────────────────────────────────────
  logger.info("Deleting existing orders...")
  const existingOrders = await orderModuleService.listOrders({}, { select: ["id"], take: null })
  if (existingOrders.length) {
    await orderModuleService.deleteOrders(existingOrders.map((o) => o.id))
    logger.info(`Deleted ${existingOrders.length} existing orders.`)
  }

  // ── 2. Delete existing products ──────────────────────────────────────────
  logger.info("Deleting existing products...")
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id"],
  })
  if (existingProducts.length) {
    await productModuleService.deleteProducts(existingProducts.map((p) => p.id))
    logger.info(`Deleted ${existingProducts.length} existing products.`)
  }

  // ── 3. Delete existing categories ────────────────────────────────────────
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

  // ── 4. Delete existing collections ───────────────────────────────────────
  logger.info("Deleting existing collections...")
  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
  })
  if (existingCollections.length) {
    await productModuleService.deleteProductCollections(
      existingCollections.map((c) => c.id)
    )
    logger.info(`Deleted ${existingCollections.length} existing collections.`)
  }

  // ── 5. Resolve dependencies ──────────────────────────────────────────────
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

  // ── 6. Create categories ─────────────────────────────────────────────────
  logger.info("Creating laptop categories...")
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Refurbished",
          handle: "refurbished",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
            description:
              "Professionally restored laptops — tested, cleaned, and ready to work.",
          },
        },
        {
          name: "Demonstration",
          handle: "demonstration",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            description:
              "Ex-demo units in near-new condition, sold at a discount.",
          },
        },
        {
          name: "Office",
          handle: "office",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
            description:
              "Reliable productivity machines built for spreadsheets, docs, and meetings.",
          },
        },
        {
          name: "Gaming",
          handle: "gaming",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80",
            description:
              "High-refresh displays and powerful GPUs for serious gaming on the go.",
          },
        },
        {
          name: "Student",
          handle: "student",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=800&q=80",
            description:
              "Affordable, dependable laptops for study, research, and campus life.",
          },
        },
        {
          name: "Travel",
          handle: "travel",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?auto=format&fit=crop&w=800&q=80",
            description:
              "Ultra-light laptops with all-day battery for the road warrior.",
          },
        },
        {
          name: "Mini laptops",
          handle: "mini-laptops",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=800&q=80",
            description:
              "Pocket-sized machines under 12 inches — compact, capable, and fun.",
          },
        },
        {
          name: "2in1",
          handle: "2in1",
          is_active: true,
          metadata: {
            thumbnail:
              "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=800&q=80",
            description:
              "Convertible laptops that double as tablets — touch, draw, or type.",
          },
        },
      ],
    },
  })

  const cat = (name: string) => {
    const found = categoryResult.find((c) => c.name === name)
    if (!found) throw new Error(`Category not found: ${name}`)
    return found.id
  }

  // ── 7. Create products ───────────────────────────────────────────────────
  logger.info("Creating laptop products...")
  await createProductsWorkflow(container).run({
    input: {
      products: [
        // ── Refurbished ──────────────────────────────────────────────────────
        {
          title: "Dell Latitude 7420 (Refurbished)",
          category_ids: [cat("Refurbished"), cat("Office")],
          description:
            "Business-class ultrabook with Intel Core i7, vivid 14\" FHD display, and an industry-leading keyboard. Fully inspected, data-wiped, battery health 85%+. Includes original charger and a 12-month warranty.",
          handle: "dell-latitude-7420-refurbished",
          weight: 1380,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 8GB / 256GB", "i7 / 16GB / 512GB", "i7 / 32GB / 1TB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "i5 / 8GB / 256GB / Good",      sku: "LAT7420-I5-8-256-GOOD",  options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Good"      }, prices: [{ amount: 529, currency_code: "eur" }, { amount: 579, currency_code: "usd" }] },
            { title: "i5 / 8GB / 256GB / Excellent", sku: "LAT7420-I5-8-256-EXC",   options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Excellent" }, prices: [{ amount: 629, currency_code: "eur" }, { amount: 679, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Good",     sku: "LAT7420-I7-16-512-GOOD", options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 749, currency_code: "eur" }, { amount: 819, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Excellent",sku: "LAT7420-I7-16-512-EXC",  options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 899, currency_code: "eur" }, { amount: 979, currency_code: "usd" }] },
            { title: "i7 / 32GB / 1TB / Good",       sku: "LAT7420-I7-32-1T-GOOD",  options: { Configuration: "i7 / 32GB / 1TB",   Condition: "Good"      }, prices: [{ amount: 999, currency_code: "eur" }, { amount: 1099, currency_code: "usd" }] },
            { title: "i7 / 32GB / 1TB / Excellent",  sku: "LAT7420-I7-32-1T-EXC",   options: { Configuration: "i7 / 32GB / 1TB",   Condition: "Excellent" }, prices: [{ amount: 1149, currency_code: "eur" }, { amount: 1249, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Lenovo ThinkPad T480 (Refurbished)",
          category_ids: [cat("Refurbished"), cat("Office")],
          description:
            "The workhorse. Legendary ThinkPad keyboard, MIL-SPEC durability, and user-upgradable RAM and storage. Professionally refurbished, data wiped, with a fresh battery. 12-month warranty included.",
          handle: "lenovo-thinkpad-t480-refurbished",
          weight: 1580,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 8GB / 256GB", "i5 / 16GB / 512GB", "i7 / 16GB / 512GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "i5 / 8GB / 256GB / Good",      sku: "T480-I5-8-256-GOOD",  options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Good"      }, prices: [{ amount: 379, currency_code: "eur" }, { amount: 419, currency_code: "usd" }] },
            { title: "i5 / 8GB / 256GB / Excellent", sku: "T480-I5-8-256-EXC",   options: { Configuration: "i5 / 8GB / 256GB",  Condition: "Excellent" }, prices: [{ amount: 449, currency_code: "eur" }, { amount: 489, currency_code: "usd" }] },
            { title: "i5 / 16GB / 512GB / Good",     sku: "T480-I5-16-512-GOOD", options: { Configuration: "i5 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 499, currency_code: "eur" }, { amount: 549, currency_code: "usd" }] },
            { title: "i5 / 16GB / 512GB / Excellent",sku: "T480-I5-16-512-EXC",  options: { Configuration: "i5 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 579, currency_code: "eur" }, { amount: 629, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Good",     sku: "T480-I7-16-512-GOOD", options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 589, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Excellent",sku: "T480-I7-16-512-EXC",  options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 679, currency_code: "eur" }, { amount: 739, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "HP EliteBook 840 G7 (Refurbished)",
          category_ids: [cat("Refurbished"), cat("Office")],
          description:
            "Sleek aluminum ultrabook with 10th-gen Intel Core, crisp 14\" FHD display, and business-grade security (fingerprint + IR camera). Refurbished to pristine condition. Includes adapter and 12-month warranty.",
          handle: "hp-elitebook-840-g7-refurbished",
          weight: 1330,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 16GB / 256GB", "i7 / 16GB / 512GB"] },
            { title: "Condition", values: ["Good", "Excellent"] },
          ],
          variants: [
            { title: "i5 / 16GB / 256GB / Good",      sku: "EB840G7-I5-16-256-GOOD", options: { Configuration: "i5 / 16GB / 256GB", Condition: "Good"      }, prices: [{ amount: 549, currency_code: "eur" }, { amount: 599, currency_code: "usd" }] },
            { title: "i5 / 16GB / 256GB / Excellent", sku: "EB840G7-I5-16-256-EXC",  options: { Configuration: "i5 / 16GB / 256GB", Condition: "Excellent" }, prices: [{ amount: 629, currency_code: "eur" }, { amount: 689, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Good",      sku: "EB840G7-I7-16-512-GOOD", options: { Configuration: "i7 / 16GB / 512GB", Condition: "Good"      }, prices: [{ amount: 729, currency_code: "eur" }, { amount: 799, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Excellent", sku: "EB840G7-I7-16-512-EXC",  options: { Configuration: "i7 / 16GB / 512GB", Condition: "Excellent" }, prices: [{ amount: 849, currency_code: "eur" }, { amount: 929, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── Demonstration ────────────────────────────────────────────────────
        {
          title: "Apple MacBook Pro 14\" M3 (Demo)",
          category_ids: [cat("Demonstration"), cat("Travel")],
          description:
            "Ex-demo MacBook Pro 14\" with M3 chip — all the performance of a new machine at a reduced price. Used only for in-store demonstrations, comes in original box with full accessories. Full Apple warranty remaining.",
          handle: "macbook-pro-14-m3-demo",
          weight: 1550,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1611186871525-9e4c5b5b7b3e?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["M3 / 8GB / 512GB", "M3 Pro / 18GB / 512GB", "M3 Pro / 18GB / 1TB"] },
            { title: "Color", values: ["Space Gray", "Silver"] },
          ],
          variants: [
            { title: "M3 / 8GB / 512GB / Space Gray",       sku: "MBP14-M3-8-512-SG",     options: { Configuration: "M3 / 8GB / 512GB",       Color: "Space Gray" }, prices: [{ amount: 1549, currency_code: "eur" }, { amount: 1699, currency_code: "usd" }] },
            { title: "M3 / 8GB / 512GB / Silver",           sku: "MBP14-M3-8-512-SL",     options: { Configuration: "M3 / 8GB / 512GB",       Color: "Silver"     }, prices: [{ amount: 1549, currency_code: "eur" }, { amount: 1699, currency_code: "usd" }] },
            { title: "M3 Pro / 18GB / 512GB / Space Gray",  sku: "MBP14-M3P-18-512-SG",   options: { Configuration: "M3 Pro / 18GB / 512GB",  Color: "Space Gray" }, prices: [{ amount: 1899, currency_code: "eur" }, { amount: 2049, currency_code: "usd" }] },
            { title: "M3 Pro / 18GB / 512GB / Silver",      sku: "MBP14-M3P-18-512-SL",   options: { Configuration: "M3 Pro / 18GB / 512GB",  Color: "Silver"     }, prices: [{ amount: 1899, currency_code: "eur" }, { amount: 2049, currency_code: "usd" }] },
            { title: "M3 Pro / 18GB / 1TB / Space Gray",    sku: "MBP14-M3P-18-1T-SG",    options: { Configuration: "M3 Pro / 18GB / 1TB",    Color: "Space Gray" }, prices: [{ amount: 2149, currency_code: "eur" }, { amount: 2299, currency_code: "usd" }] },
            { title: "M3 Pro / 18GB / 1TB / Silver",        sku: "MBP14-M3P-18-1T-SL",    options: { Configuration: "M3 Pro / 18GB / 1TB",    Color: "Silver"     }, prices: [{ amount: 2149, currency_code: "eur" }, { amount: 2299, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Dell XPS 15 (Demo)",
          category_ids: [cat("Demonstration")],
          description:
            "Dell's flagship creator laptop — 15.6\" OLED touch display, Core i7, and NVIDIA RTX 4060. Minor shelf wear from showroom use, fully functional, reset to factory. 12-month Dell warranty remaining.",
          handle: "dell-xps-15-demo",
          weight: 1860,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i7 / 16GB / 512GB", "i7 / 32GB / 1TB"] },
          ],
          variants: [
            { title: "i7 / 16GB / 512GB", sku: "XPS15-DEMO-I7-16-512", options: { Configuration: "i7 / 16GB / 512GB" }, prices: [{ amount: 1399, currency_code: "eur" }, { amount: 1529, currency_code: "usd" }] },
            { title: "i7 / 32GB / 1TB",   sku: "XPS15-DEMO-I7-32-1T",  options: { Configuration: "i7 / 32GB / 1TB"   }, prices: [{ amount: 1699, currency_code: "eur" }, { amount: 1849, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── Office ───────────────────────────────────────────────────────────
        {
          title: "HP ProBook 450 G10",
          category_ids: [cat("Office")],
          description:
            "Dependable 15.6\" office laptop with 13th-gen Intel Core, full-size keyboard with numpad, and plenty of ports. Ideal for everyday productivity in small and medium businesses.",
          handle: "hp-probook-450-g10",
          weight: 1740,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 8GB / 256GB", "i5 / 16GB / 512GB", "i7 / 16GB / 512GB"] },
          ],
          variants: [
            { title: "i5 / 8GB / 256GB",  sku: "PB450G10-I5-8-256",   options: { Configuration: "i5 / 8GB / 256GB"  }, prices: [{ amount: 699,  currency_code: "eur" }, { amount: 759,  currency_code: "usd" }] },
            { title: "i5 / 16GB / 512GB", sku: "PB450G10-I5-16-512",  options: { Configuration: "i5 / 16GB / 512GB" }, prices: [{ amount: 829,  currency_code: "eur" }, { amount: 899,  currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB", sku: "PB450G10-I7-16-512",  options: { Configuration: "i7 / 16GB / 512GB" }, prices: [{ amount: 999,  currency_code: "eur" }, { amount: 1089, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Lenovo ThinkPad E14 Gen 5",
          category_ids: [cat("Office")],
          description:
            "Entry-level ThinkPad for small business — AMD Ryzen 5/7, 14\" FHD display, and the iconic keyboard you know and love. Spill-resistant and built to last.",
          handle: "lenovo-thinkpad-e14-gen-5",
          weight: 1410,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1484788984921-03950022c9ef?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ryzen 5 / 8GB / 256GB", "Ryzen 5 / 16GB / 512GB", "Ryzen 7 / 16GB / 1TB"] },
          ],
          variants: [
            { title: "Ryzen 5 / 8GB / 256GB",   sku: "E14G5-R5-8-256",   options: { Configuration: "Ryzen 5 / 8GB / 256GB"   }, prices: [{ amount: 749,  currency_code: "eur" }, { amount: 819,  currency_code: "usd" }] },
            { title: "Ryzen 5 / 16GB / 512GB",  sku: "E14G5-R5-16-512",  options: { Configuration: "Ryzen 5 / 16GB / 512GB"  }, prices: [{ amount: 899,  currency_code: "eur" }, { amount: 979,  currency_code: "usd" }] },
            { title: "Ryzen 7 / 16GB / 1TB",    sku: "E14G5-R7-16-1T",   options: { Configuration: "Ryzen 7 / 16GB / 1TB"    }, prices: [{ amount: 1099, currency_code: "eur" }, { amount: 1199, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Dell Vostro 3520",
          category_ids: [cat("Office")],
          description:
            "Solid, no-nonsense business laptop. 15.6\" FHD display, full-size keyboard, and Dell's business-grade reliability. Great for finance, admin, and general office work.",
          handle: "dell-vostro-3520",
          weight: 1650,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i3 / 8GB / 256GB", "i5 / 8GB / 512GB", "i7 / 16GB / 512GB"] },
          ],
          variants: [
            { title: "i3 / 8GB / 256GB",  sku: "VOS3520-I3-8-256",   options: { Configuration: "i3 / 8GB / 256GB"  }, prices: [{ amount: 549, currency_code: "eur" }, { amount: 599, currency_code: "usd" }] },
            { title: "i5 / 8GB / 512GB",  sku: "VOS3520-I5-8-512",   options: { Configuration: "i5 / 8GB / 512GB"  }, prices: [{ amount: 699, currency_code: "eur" }, { amount: 759, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB", sku: "VOS3520-I7-16-512",  options: { Configuration: "i7 / 16GB / 512GB" }, prices: [{ amount: 899, currency_code: "eur" }, { amount: 979, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── Gaming ───────────────────────────────────────────────────────────
        {
          title: "ASUS ROG Strix G16",
          category_ids: [cat("Gaming")],
          description:
            "16\" gaming beast with 13th-gen Intel Core i9, NVIDIA RTX 4070, and a 240Hz QHD+ display. Advanced cooling keeps it quiet under load. RGB all the things.",
          handle: "asus-rog-strix-g16",
          weight: 2500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "GPU",    values: ["RTX 4060", "RTX 4070", "RTX 4080"] },
            { title: "Memory", values: ["16GB / 1TB", "32GB / 1TB"] },
          ],
          variants: [
            { title: "RTX 4060 / 16GB / 1TB", sku: "ROGG16-4060-16-1T", options: { GPU: "RTX 4060", Memory: "16GB / 1TB" }, prices: [{ amount: 1599, currency_code: "eur" }, { amount: 1749, currency_code: "usd" }] },
            { title: "RTX 4060 / 32GB / 1TB", sku: "ROGG16-4060-32-1T", options: { GPU: "RTX 4060", Memory: "32GB / 1TB" }, prices: [{ amount: 1799, currency_code: "eur" }, { amount: 1949, currency_code: "usd" }] },
            { title: "RTX 4070 / 16GB / 1TB", sku: "ROGG16-4070-16-1T", options: { GPU: "RTX 4070", Memory: "16GB / 1TB" }, prices: [{ amount: 1999, currency_code: "eur" }, { amount: 2179, currency_code: "usd" }] },
            { title: "RTX 4070 / 32GB / 1TB", sku: "ROGG16-4070-32-1T", options: { GPU: "RTX 4070", Memory: "32GB / 1TB" }, prices: [{ amount: 2199, currency_code: "eur" }, { amount: 2379, currency_code: "usd" }] },
            { title: "RTX 4080 / 16GB / 1TB", sku: "ROGG16-4080-16-1T", options: { GPU: "RTX 4080", Memory: "16GB / 1TB" }, prices: [{ amount: 2499, currency_code: "eur" }, { amount: 2699, currency_code: "usd" }] },
            { title: "RTX 4080 / 32GB / 1TB", sku: "ROGG16-4080-32-1T", options: { GPU: "RTX 4080", Memory: "32GB / 1TB" }, prices: [{ amount: 2699, currency_code: "eur" }, { amount: 2899, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Lenovo Legion Pro 5",
          category_ids: [cat("Gaming")],
          description:
            "Serious gaming power without breaking the bank. 16\" QHD+ 165Hz display, AMD Ryzen 7, and NVIDIA RTX 4060/4070. Legion Coldfront cooling keeps thermals in check.",
          handle: "lenovo-legion-pro-5",
          weight: 2500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "GPU",    values: ["RTX 4060", "RTX 4070"] },
            { title: "Memory", values: ["16GB / 512GB", "32GB / 1TB"] },
          ],
          variants: [
            { title: "RTX 4060 / 16GB / 512GB", sku: "LEGPRO5-4060-16-512", options: { GPU: "RTX 4060", Memory: "16GB / 512GB" }, prices: [{ amount: 1449, currency_code: "eur" }, { amount: 1599, currency_code: "usd" }] },
            { title: "RTX 4060 / 32GB / 1TB",   sku: "LEGPRO5-4060-32-1T",  options: { GPU: "RTX 4060", Memory: "32GB / 1TB"   }, prices: [{ amount: 1699, currency_code: "eur" }, { amount: 1849, currency_code: "usd" }] },
            { title: "RTX 4070 / 16GB / 512GB", sku: "LEGPRO5-4070-16-512", options: { GPU: "RTX 4070", Memory: "16GB / 512GB" }, prices: [{ amount: 1899, currency_code: "eur" }, { amount: 2049, currency_code: "usd" }] },
            { title: "RTX 4070 / 32GB / 1TB",   sku: "LEGPRO5-4070-32-1T",  options: { GPU: "RTX 4070", Memory: "32GB / 1TB"   }, prices: [{ amount: 2099, currency_code: "eur" }, { amount: 2279, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "MSI Katana 15",
          category_ids: [cat("Gaming"), cat("Student")],
          description:
            "Budget-friendly gaming laptop that punches above its weight. 15.6\" FHD 144Hz display, Intel Core i7-13620H, and NVIDIA RTX 4050/4060. A solid pick for students who game.",
          handle: "msi-katana-15",
          weight: 2250,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "GPU",    values: ["RTX 4050", "RTX 4060"] },
            { title: "Memory", values: ["16GB / 512GB", "16GB / 1TB"] },
          ],
          variants: [
            { title: "RTX 4050 / 16GB / 512GB", sku: "KATANA15-4050-16-512", options: { GPU: "RTX 4050", Memory: "16GB / 512GB" }, prices: [{ amount: 1099, currency_code: "eur" }, { amount: 1199, currency_code: "usd" }] },
            { title: "RTX 4050 / 16GB / 1TB",   sku: "KATANA15-4050-16-1T",  options: { GPU: "RTX 4050", Memory: "16GB / 1TB"   }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "RTX 4060 / 16GB / 512GB", sku: "KATANA15-4060-16-512", options: { GPU: "RTX 4060", Memory: "16GB / 512GB" }, prices: [{ amount: 1349, currency_code: "eur" }, { amount: 1479, currency_code: "usd" }] },
            { title: "RTX 4060 / 16GB / 1TB",   sku: "KATANA15-4060-16-1T",  options: { GPU: "RTX 4060", Memory: "16GB / 1TB"   }, prices: [{ amount: 1449, currency_code: "eur" }, { amount: 1579, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── Student ──────────────────────────────────────────────────────────
        {
          title: "Acer Aspire 5",
          category_ids: [cat("Student")],
          description:
            "The classic student laptop. 15.6\" FHD display, AMD Ryzen 5, and enough power for lectures, essays, and late-night Netflix. Thin, light, and affordable.",
          handle: "acer-aspire-5",
          weight: 1760,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ryzen 3 / 8GB / 256GB", "Ryzen 5 / 8GB / 512GB", "Ryzen 7 / 16GB / 512GB"] },
          ],
          variants: [
            { title: "Ryzen 3 / 8GB / 256GB",  sku: "ASPIRE5-R3-8-256",   options: { Configuration: "Ryzen 3 / 8GB / 256GB"  }, prices: [{ amount: 449, currency_code: "eur" }, { amount: 489, currency_code: "usd" }] },
            { title: "Ryzen 5 / 8GB / 512GB",  sku: "ASPIRE5-R5-8-512",   options: { Configuration: "Ryzen 5 / 8GB / 512GB"  }, prices: [{ amount: 599, currency_code: "eur" }, { amount: 649, currency_code: "usd" }] },
            { title: "Ryzen 7 / 16GB / 512GB", sku: "ASPIRE5-R7-16-512",  options: { Configuration: "Ryzen 7 / 16GB / 512GB" }, prices: [{ amount: 749, currency_code: "eur" }, { amount: 819, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Lenovo IdeaPad 3",
          category_ids: [cat("Student")],
          description:
            "Lightweight 14\" laptop with AMD Ryzen, rapid charging, and a comfortable keyboard. Perfect for students who need to carry it between classes all day.",
          handle: "lenovo-ideapad-3",
          weight: 1410,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ryzen 3 / 8GB / 256GB", "Ryzen 5 / 8GB / 512GB"] },
            { title: "Color", values: ["Arctic Grey", "Sand"] },
          ],
          variants: [
            { title: "Ryzen 3 / 8GB / 256GB / Arctic Grey", sku: "IDEAPAD3-R3-8-256-AG", options: { Configuration: "Ryzen 3 / 8GB / 256GB", Color: "Arctic Grey" }, prices: [{ amount: 429, currency_code: "eur" }, { amount: 469, currency_code: "usd" }] },
            { title: "Ryzen 3 / 8GB / 256GB / Sand",        sku: "IDEAPAD3-R3-8-256-SD", options: { Configuration: "Ryzen 3 / 8GB / 256GB", Color: "Sand"        }, prices: [{ amount: 429, currency_code: "eur" }, { amount: 469, currency_code: "usd" }] },
            { title: "Ryzen 5 / 8GB / 512GB / Arctic Grey", sku: "IDEAPAD3-R5-8-512-AG", options: { Configuration: "Ryzen 5 / 8GB / 512GB", Color: "Arctic Grey" }, prices: [{ amount: 559, currency_code: "eur" }, { amount: 609, currency_code: "usd" }] },
            { title: "Ryzen 5 / 8GB / 512GB / Sand",        sku: "IDEAPAD3-R5-8-512-SD", options: { Configuration: "Ryzen 5 / 8GB / 512GB", Color: "Sand"        }, prices: [{ amount: 559, currency_code: "eur" }, { amount: 609, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "HP Pavilion 15",
          category_ids: [cat("Student")],
          description:
            "Stylish 15.6\" student laptop with Intel Core i5, IPS FHD display, and fast SSD. Great all-rounder for course work, video calls, and entertainment.",
          handle: "hp-pavilion-15",
          weight: 1750,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i3 / 8GB / 256GB", "i5 / 16GB / 512GB"] },
          ],
          variants: [
            { title: "i3 / 8GB / 256GB",  sku: "PAV15-I3-8-256",   options: { Configuration: "i3 / 8GB / 256GB"  }, prices: [{ amount: 499, currency_code: "eur" }, { amount: 549, currency_code: "usd" }] },
            { title: "i5 / 16GB / 512GB", sku: "PAV15-I5-16-512",  options: { Configuration: "i5 / 16GB / 512GB" }, prices: [{ amount: 729, currency_code: "eur" }, { amount: 799, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── Travel ───────────────────────────────────────────────────────────
        {
          title: "Apple MacBook Air M3 13\"",
          category_ids: [cat("Travel")],
          description:
            "The definitive travel laptop. Silent fanless design, up to 18 hours of battery, and the M3 chip flying through any workload. Just 1.24kg and impossibly thin.",
          handle: "macbook-air-m3-13",
          weight: 1240,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1611186871525-9e4c5b5b7b3e?auto=format&fit=crop&w=800&q=80" },
            { url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["8GB / 256GB", "8GB / 512GB", "16GB / 512GB"] },
            { title: "Color", values: ["Midnight", "Starlight", "Space Gray", "Silver"] },
          ],
          variants: [
            { title: "8GB / 256GB / Midnight",    sku: "MBA13M3-8-256-MN",  options: { Configuration: "8GB / 256GB",  Color: "Midnight"   }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "8GB / 256GB / Starlight",   sku: "MBA13M3-8-256-SL",  options: { Configuration: "8GB / 256GB",  Color: "Starlight"  }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "8GB / 256GB / Space Gray",  sku: "MBA13M3-8-256-SG",  options: { Configuration: "8GB / 256GB",  Color: "Space Gray" }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "8GB / 256GB / Silver",      sku: "MBA13M3-8-256-SI",  options: { Configuration: "8GB / 256GB",  Color: "Silver"     }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "8GB / 512GB / Midnight",    sku: "MBA13M3-8-512-MN",  options: { Configuration: "8GB / 512GB",  Color: "Midnight"   }, prices: [{ amount: 1399, currency_code: "eur" }, { amount: 1499, currency_code: "usd" }] },
            { title: "8GB / 512GB / Starlight",   sku: "MBA13M3-8-512-SL",  options: { Configuration: "8GB / 512GB",  Color: "Starlight"  }, prices: [{ amount: 1399, currency_code: "eur" }, { amount: 1499, currency_code: "usd" }] },
            { title: "16GB / 512GB / Midnight",   sku: "MBA13M3-16-512-MN", options: { Configuration: "16GB / 512GB", Color: "Midnight"   }, prices: [{ amount: 1599, currency_code: "eur" }, { amount: 1699, currency_code: "usd" }] },
            { title: "16GB / 512GB / Starlight",  sku: "MBA13M3-16-512-SL", options: { Configuration: "16GB / 512GB", Color: "Starlight"  }, prices: [{ amount: 1599, currency_code: "eur" }, { amount: 1699, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "LG Gram 14",
          category_ids: [cat("Travel")],
          description:
            "Incredibly light at just 999 grams. 14\" WUXGA display, Intel Core Ultra 5/7, and a massive battery. Designed for constant travel without compromise.",
          handle: "lg-gram-14",
          weight: 999,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1491336477066-31156b5e4f35?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ultra 5 / 16GB / 512GB", "Ultra 7 / 16GB / 1TB"] },
          ],
          variants: [
            { title: "Ultra 5 / 16GB / 512GB", sku: "GRAM14-U5-16-512", options: { Configuration: "Ultra 5 / 16GB / 512GB" }, prices: [{ amount: 1299, currency_code: "eur" }, { amount: 1419, currency_code: "usd" }] },
            { title: "Ultra 7 / 16GB / 1TB",   sku: "GRAM14-U7-16-1T",  options: { Configuration: "Ultra 7 / 16GB / 1TB"   }, prices: [{ amount: 1549, currency_code: "eur" }, { amount: 1689, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "ASUS ZenBook 14 OLED",
          category_ids: [cat("Travel")],
          description:
            "Gorgeous 14\" OLED display, Intel Core Ultra 7, and all-metal chassis under 1.3kg. Perfect for creatives on the move.",
          handle: "asus-zenbook-14-oled",
          weight: 1280,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ultra 5 / 16GB / 512GB", "Ultra 7 / 16GB / 1TB", "Ultra 7 / 32GB / 1TB"] },
          ],
          variants: [
            { title: "Ultra 5 / 16GB / 512GB", sku: "ZENBOOK14-U5-16-512", options: { Configuration: "Ultra 5 / 16GB / 512GB" }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
            { title: "Ultra 7 / 16GB / 1TB",   sku: "ZENBOOK14-U7-16-1T",  options: { Configuration: "Ultra 7 / 16GB / 1TB"   }, prices: [{ amount: 1449, currency_code: "eur" }, { amount: 1579, currency_code: "usd" }] },
            { title: "Ultra 7 / 32GB / 1TB",   sku: "ZENBOOK14-U7-32-1T",  options: { Configuration: "Ultra 7 / 32GB / 1TB"   }, prices: [{ amount: 1649, currency_code: "eur" }, { amount: 1789, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── Mini laptops ─────────────────────────────────────────────────────
        {
          title: "GPD Pocket 3",
          category_ids: [cat("Mini laptops"), cat("Travel")],
          description:
            "A pocketable 8\" laptop with Intel Core i7, full keyboard, and touchscreen. Modular I/O expansion slot lets you add KVM, serial, or extra ports. The ultimate tinkerer's machine.",
          handle: "gpd-pocket-3",
          weight: 725,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Pentium / 8GB / 512GB", "i7 / 16GB / 1TB"] },
          ],
          variants: [
            { title: "Pentium / 8GB / 512GB", sku: "GPDP3-PENT-8-512",  options: { Configuration: "Pentium / 8GB / 512GB" }, prices: [{ amount: 699,  currency_code: "eur" }, { amount: 759,  currency_code: "usd" }] },
            { title: "i7 / 16GB / 1TB",       sku: "GPDP3-I7-16-1T",    options: { Configuration: "i7 / 16GB / 1TB"       }, prices: [{ amount: 1199, currency_code: "eur" }, { amount: 1299, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "One Netbook OneMix 4",
          category_ids: [cat("Mini laptops")],
          description:
            "10.1\" 2K touchscreen with stylus support, Intel Core i7, and a 360° hinge. Fits in a jacket pocket. An impressive amount of laptop in an impossibly small package.",
          handle: "one-netbook-onemix-4",
          weight: 659,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1618410320928-25228d811631?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 16GB / 512GB", "i7 / 16GB / 1TB"] },
          ],
          variants: [
            { title: "i5 / 16GB / 512GB", sku: "OMIX4-I5-16-512", options: { Configuration: "i5 / 16GB / 512GB" }, prices: [{ amount: 999,  currency_code: "eur" }, { amount: 1099, currency_code: "usd" }] },
            { title: "i7 / 16GB / 1TB",   sku: "OMIX4-I7-16-1T",  options: { Configuration: "i7 / 16GB / 1TB"   }, prices: [{ amount: 1299, currency_code: "eur" }, { amount: 1419, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "ASUS Chromebook CX1 (11\")",
          category_ids: [cat("Mini laptops"), cat("Student")],
          description:
            "Compact 11.6\" Chromebook — rugged, fanless, and ideal as a secondary machine for travel or kids' homework. All-day battery and instant-on ChromeOS.",
          handle: "asus-chromebook-cx1-11",
          weight: 1180,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["4GB / 64GB eMMC", "8GB / 128GB eMMC"] },
          ],
          variants: [
            { title: "4GB / 64GB eMMC",  sku: "CX1-11-4-64",  options: { Configuration: "4GB / 64GB eMMC"  }, prices: [{ amount: 249, currency_code: "eur" }, { amount: 269, currency_code: "usd" }] },
            { title: "8GB / 128GB eMMC", sku: "CX1-11-8-128", options: { Configuration: "8GB / 128GB eMMC" }, prices: [{ amount: 329, currency_code: "eur" }, { amount: 359, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },

        // ── 2in1 ─────────────────────────────────────────────────────────────
        {
          title: "Microsoft Surface Pro 9",
          category_ids: [cat("2in1"), cat("Travel")],
          description:
            "Tablet and laptop in one. 13\" PixelSense touch display, Intel Core i5/i7, and detachable Type Cover (sold separately). Slim, gorgeous, and endlessly versatile.",
          handle: "microsoft-surface-pro-9",
          weight: 879,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["i5 / 8GB / 256GB", "i5 / 16GB / 256GB", "i7 / 16GB / 512GB"] },
            { title: "Color", values: ["Platinum", "Graphite", "Sapphire", "Forest"] },
          ],
          variants: [
            { title: "i5 / 8GB / 256GB / Platinum",    sku: "SPRO9-I5-8-256-PT",   options: { Configuration: "i5 / 8GB / 256GB",  Color: "Platinum" }, prices: [{ amount: 1099, currency_code: "eur" }, { amount: 1199, currency_code: "usd" }] },
            { title: "i5 / 8GB / 256GB / Graphite",    sku: "SPRO9-I5-8-256-GR",   options: { Configuration: "i5 / 8GB / 256GB",  Color: "Graphite" }, prices: [{ amount: 1099, currency_code: "eur" }, { amount: 1199, currency_code: "usd" }] },
            { title: "i5 / 16GB / 256GB / Sapphire",   sku: "SPRO9-I5-16-256-SA",  options: { Configuration: "i5 / 16GB / 256GB", Color: "Sapphire" }, prices: [{ amount: 1349, currency_code: "eur" }, { amount: 1469, currency_code: "usd" }] },
            { title: "i5 / 16GB / 256GB / Forest",     sku: "SPRO9-I5-16-256-FO",  options: { Configuration: "i5 / 16GB / 256GB", Color: "Forest"   }, prices: [{ amount: 1349, currency_code: "eur" }, { amount: 1469, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Platinum",   sku: "SPRO9-I7-16-512-PT",  options: { Configuration: "i7 / 16GB / 512GB", Color: "Platinum" }, prices: [{ amount: 1699, currency_code: "eur" }, { amount: 1849, currency_code: "usd" }] },
            { title: "i7 / 16GB / 512GB / Graphite",   sku: "SPRO9-I7-16-512-GR",  options: { Configuration: "i7 / 16GB / 512GB", Color: "Graphite" }, prices: [{ amount: 1699, currency_code: "eur" }, { amount: 1849, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Lenovo Yoga 7i",
          category_ids: [cat("2in1")],
          description:
            "14\" 2.2K convertible with 360° hinge and pen support. Intel Core Ultra 7, sleek aluminum build, and a smart webcam that blurs your background automatically.",
          handle: "lenovo-yoga-7i",
          weight: 1450,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ultra 5 / 16GB / 512GB", "Ultra 7 / 16GB / 1TB"] },
          ],
          variants: [
            { title: "Ultra 5 / 16GB / 512GB", sku: "YOGA7I-U5-16-512", options: { Configuration: "Ultra 5 / 16GB / 512GB" }, prices: [{ amount: 1099, currency_code: "eur" }, { amount: 1199, currency_code: "usd" }] },
            { title: "Ultra 7 / 16GB / 1TB",   sku: "YOGA7I-U7-16-1T",  options: { Configuration: "Ultra 7 / 16GB / 1TB"   }, prices: [{ amount: 1349, currency_code: "eur" }, { amount: 1469, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "HP Spectre x360 14",
          category_ids: [cat("2in1"), cat("Travel")],
          description:
            "Premium 14\" convertible with stunning OLED touchscreen, gem-cut aluminum chassis, and Intel Core Ultra 7. Includes stylus for drawing and note-taking.",
          handle: "hp-spectre-x360-14",
          weight: 1440,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" },
          ],
          options: [
            { title: "Configuration", values: ["Ultra 7 / 16GB / 512GB", "Ultra 7 / 32GB / 1TB"] },
            { title: "Color", values: ["Nightfall Black", "Nocturne Blue"] },
          ],
          variants: [
            { title: "Ultra 7 / 16GB / 512GB / Nightfall Black", sku: "SPECX360-U7-16-512-NB", options: { Configuration: "Ultra 7 / 16GB / 512GB", Color: "Nightfall Black" }, prices: [{ amount: 1549, currency_code: "eur" }, { amount: 1699, currency_code: "usd" }] },
            { title: "Ultra 7 / 16GB / 512GB / Nocturne Blue",   sku: "SPECX360-U7-16-512-NC", options: { Configuration: "Ultra 7 / 16GB / 512GB", Color: "Nocturne Blue"   }, prices: [{ amount: 1549, currency_code: "eur" }, { amount: 1699, currency_code: "usd" }] },
            { title: "Ultra 7 / 32GB / 1TB / Nightfall Black",   sku: "SPECX360-U7-32-1T-NB",  options: { Configuration: "Ultra 7 / 32GB / 1TB",   Color: "Nightfall Black" }, prices: [{ amount: 1899, currency_code: "eur" }, { amount: 2049, currency_code: "usd" }] },
            { title: "Ultra 7 / 32GB / 1TB / Nocturne Blue",     sku: "SPECX360-U7-32-1T-NC",  options: { Configuration: "Ultra 7 / 32GB / 1TB",   Color: "Nocturne Blue"   }, prices: [{ amount: 1899, currency_code: "eur" }, { amount: 2049, currency_code: "usd" }] },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  })

  // ── 8. Seed inventory levels ─────────────────────────────────────────────
  logger.info("Seeding inventory levels...")
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
      await inventoryModuleService.updateInventoryLevels([
        {
          inventory_item_id: item.id,
          location_id: stockLocation.id,
          stocked_quantity: 25,
        },
      ])
    } else {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: [
            {
              location_id: stockLocation.id,
              stocked_quantity: 25,
              inventory_item_id: item.id,
            },
          ],
        },
      })
    }
  }

  // ── 9. Mark seed as complete ─────────────────────────────────────────────
  await storeModuleService.updateStores(store.id, {
    metadata: {
      ...(store.metadata || {}),
      [SEED_FLAG]: new Date().toISOString(),
    },
  })

  logger.info(
    `Done! Laptop shop seeded successfully. Flag "${SEED_FLAG}" set on store to prevent re-runs.`
  )
}
