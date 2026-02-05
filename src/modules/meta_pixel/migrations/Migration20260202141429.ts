import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260202141429 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "meta_pixel" add column if not exists "is_active" boolean not null default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "meta_pixel" drop column if exists "is_active";`);
  }

}
