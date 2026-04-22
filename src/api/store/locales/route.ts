import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any

  const [store] = await storeService.listStores(
    {},
    { relations: ["supported_locales"] }
  )

  const localeNames = new Intl.DisplayNames(["en"], { type: "language" })

  const locales = (store?.supported_locales ?? []).map(
    (l: { locale_code: string }) => ({
      code: l.locale_code,
      name: localeNames.of(l.locale_code) ?? l.locale_code,
    })
  )

  res.json({ locales })
}
