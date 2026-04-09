import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260409081116 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "order_tag" ("id" text not null, "order_id" text not null, "value" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_tag_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_tag_deleted_at" ON "order_tag" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "order_tag" cascade;`);
  }

}
