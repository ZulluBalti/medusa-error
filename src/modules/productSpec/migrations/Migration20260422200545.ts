import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260422200545 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "product_specification" (
        "id" text not null,
        "product_id" text not null,
        "key" text not null,
        "value" text not null,
        "sort_order" integer not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_specification_pkey" primary key ("id")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_specification_product_id"
        ON "product_specification" ("product_id") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_specification_deleted_at"
        ON "product_specification" ("deleted_at") WHERE deleted_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_specification" cascade;`)
  }
}
