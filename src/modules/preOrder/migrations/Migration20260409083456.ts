import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260409083456 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pre_order_setting" ("id" text not null, "product_id" text not null, "enabled" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pre_order_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pre_order_setting_deleted_at" ON "pre_order_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pre_order_setting" cascade;`);
  }

}
