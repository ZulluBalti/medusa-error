import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260201140543 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "meta_pixel" drop constraint if exists "meta_pixel_name_unique";`);
    this.addSql(`create table if not exists "meta_pixel" ("id" text not null, "name" text not null, "pixel_id" text not null, "tracking" text check ("tracking" in ('all', 'selected', 'excluded')) not null, "pages" text[] null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "meta_pixel_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_meta_pixel_name_unique" ON "meta_pixel" ("name") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_meta_pixel_deleted_at" ON "meta_pixel" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "meta_pixel" cascade;`);
  }

}
