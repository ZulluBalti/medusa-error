import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260422220000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_specification"
        ADD COLUMN IF NOT EXISTS "variant_id" text null;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_specification_variant_id"
        ON "product_specification" ("variant_id") WHERE deleted_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "product_specification" DROP COLUMN IF EXISTS "variant_id";
    `)
  }
}
