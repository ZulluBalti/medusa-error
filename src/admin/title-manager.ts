const TITLE_SUFFIX = "Admin"

const EXACT_TITLES: Record<string, string> = {
  "": "Dashboard",
  "brands": "Brands",
  "blog": "Blog Posts",
  "collections": "Collections",
  "customers": "Customers",
  "draft-orders": "Draft Orders",
  "email-templates": "Email Templates",
  "gift-cards": "Gift Cards",
  "inventory": "Inventory",
  "invite": "Invite",
  "login": "Login",
  "order-tags": "Orders by Tag",
  "orders": "Orders",
  "price-lists": "Price Lists",
  "product-categories": "Categories",
  "products": "Products",
  "promotions": "Promotions",
  "regions": "Regions",
  "reservations": "Reservations",
  "return-reasons": "Return Reasons",
  "sales-channels": "Sales Channels",
  "settings": "Settings",
  "shipping-profiles": "Shipping Profiles",
  "stock-locations": "Stock Locations",
  "tracking": "Tracking",
  "tracking/gtm": "Google Tag Manager",
  "tracking/meta-pixel": "Meta Pixels",
  "users": "Users",
}

const DETAIL_TITLES: Record<string, string> = {
  "collections": "Collection Details",
  "customers": "Customer Details",
  "draft-orders": "Draft Order Details",
  "gift-cards": "Gift Card Details",
  "inventory": "Inventory Item Details",
  "orders": "Order Details",
  "price-lists": "Price List Details",
  "product-categories": "Category Details",
  "products": "Product Details",
  "promotions": "Promotion Details",
  "regions": "Region Details",
  "sales-channels": "Sales Channel Details",
  "settings": "Settings",
  "shipping-profiles": "Shipping Profile Details",
  "stock-locations": "Stock Location Details",
  "users": "User Details",
}

const SINGULAR_TITLES: Record<string, string> = {
  "brands": "Brand",
  "collections": "Collection",
  "customers": "Customer",
  "draft-orders": "Draft Order",
  "email-templates": "Email Template",
  "gift-cards": "Gift Card",
  "inventory": "Inventory Item",
  "order-tags": "Order Tag",
  "orders": "Order",
  "price-lists": "Price List",
  "product-categories": "Category",
  "products": "Product",
  "promotions": "Promotion",
  "regions": "Region",
  "sales-channels": "Sales Channel",
  "shipping-profiles": "Shipping Profile",
  "stock-locations": "Stock Location",
  "users": "User",
}

const ACTION_TITLES: Record<string, string> = {
  "create": "Create",
  "edit": "Edit",
}

const ID_SEGMENT =
  /^(?:[a-z]+_[a-z0-9]+|cus_[a-z0-9]+|prod_[a-z0-9]+|order_[a-z0-9]+|draft_order_[a-z0-9]+|cart_[a-z0-9]+|user_[a-z0-9]+|invite_[a-z0-9]+)$/i

const toTitleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const formatTitle = (value: string) => `${value} | ${TITLE_SUFFIX}`

const normalizePath = () => {
  const segments = window.location.pathname.split("/").filter(Boolean)
  const appIndex = segments.lastIndexOf("app")
  const scopedSegments = appIndex >= 0 ? segments.slice(appIndex + 1) : segments

  return scopedSegments.join("/")
}

const deriveTitleFromPath = (normalizedPath: string) => {
  if (normalizedPath in EXACT_TITLES) {
    return EXACT_TITLES[normalizedPath]!
  }

  const segments = normalizedPath.split("/").filter(Boolean)

  if (segments.length === 0) {
    return EXACT_TITLES[""]
  }

  const lastSegment = segments[segments.length - 1]
  const previousSegment = segments[segments.length - 2]

  if (lastSegment && lastSegment in ACTION_TITLES) {
    const action = ACTION_TITLES[lastSegment]!
    const resource = previousSegment
      ? SINGULAR_TITLES[previousSegment] ?? EXACT_TITLES[previousSegment] ?? toTitleCase(previousSegment)
      : ""

    return resource ? `${action} ${resource}` : action
  }

  if (lastSegment && ID_SEGMENT.test(lastSegment) && previousSegment) {
    return DETAIL_TITLES[previousSegment] ?? `${toTitleCase(previousSegment)} Details`
  }

  if (previousSegment && ID_SEGMENT.test(previousSegment)) {
    const parentSegment = segments[segments.length - 3] ?? ""
    const parentTitle = DETAIL_TITLES[parentSegment] ?? "Details"
    return `${toTitleCase(lastSegment)} | ${parentTitle}`
  }

  return EXACT_TITLES[lastSegment] ?? toTitleCase(lastSegment)
}

const resolveTitle = () => {
  const normalizedPath = normalizePath()
  return formatTitle(deriveTitleFromPath(normalizedPath))
}

let lastResolvedPath = ""
let lastAppliedTitle = ""

const syncDocumentTitle = () => {
  const normalizedPath = normalizePath()
  const nextTitle = formatTitle(deriveTitleFromPath(normalizedPath))

  if (normalizedPath !== lastResolvedPath || document.title !== nextTitle) {
    lastResolvedPath = normalizedPath
    lastAppliedTitle = nextTitle
    document.title = nextTitle
  }
}

const scheduleSync = () => {
  queueMicrotask(syncDocumentTitle)
}

const wrapHistoryMethod = (method: "pushState" | "replaceState") => {
  const original = window.history[method]

  window.history[method] = function (...args) {
    const result = original.apply(this, args)
    scheduleSync()
    return result
  }
}

type TitleManagerWindow = Window & {
  __medusaAdminTitleManagerInitialized?: boolean
  __medusaAdminTitleManagerIntervalId?: number
}

const runtimeWindow = window as TitleManagerWindow

if (!runtimeWindow.__medusaAdminTitleManagerInitialized) {
  runtimeWindow.__medusaAdminTitleManagerInitialized = true

  const titleObserver = new MutationObserver(() => {
    if (document.title !== lastAppliedTitle) {
      scheduleSync()
    }
  })

  wrapHistoryMethod("pushState")
  wrapHistoryMethod("replaceState")

  window.addEventListener("popstate", scheduleSync)
  window.addEventListener("hashchange", scheduleSync)
  window.addEventListener("focus", scheduleSync)
  document.addEventListener("visibilitychange", scheduleSync)
  document.addEventListener("DOMContentLoaded", scheduleSync)

  titleObserver.observe(document.querySelector("title") ?? document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  runtimeWindow.__medusaAdminTitleManagerIntervalId = window.setInterval(syncDocumentTitle, 250)

  document.title = resolveTitle()
  lastAppliedTitle = document.title
  lastResolvedPath = normalizePath()
}
