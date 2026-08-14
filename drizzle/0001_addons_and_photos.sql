CREATE TYPE "public"."addon_kind" AS ENUM('DELIVERY', 'SERVICE');--> statement-breakpoint
CREATE TABLE "addons" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"name_hi" varchar(200) NOT NULL,
	"desc_en" text DEFAULT '' NOT NULL,
	"desc_hi" text DEFAULT '' NOT NULL,
	"price_in_paise" integer NOT NULL,
	"image_url" text,
	"art_key" varchar(40) DEFAULT 'kalash' NOT NULL,
	"kind" "addon_kind" DEFAULT 'SERVICE' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puja_addons" (
	"puja_id" text NOT NULL,
	"addon_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "puja_addons_puja_id_addon_id_pk" PRIMARY KEY("puja_id","addon_id")
);
--> statement-breakpoint
CREATE TABLE "booking_addons" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"addon_id" text,
	"name_en" varchar(200) NOT NULL,
	"name_hi" varchar(200) NOT NULL,
	"price_in_paise" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"kind" "addon_kind" DEFAULT 'SERVICE' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "puja_addons" ADD CONSTRAINT "puja_addons_puja_id_pujas_id_fk" FOREIGN KEY ("puja_id") REFERENCES "public"."pujas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puja_addons" ADD CONSTRAINT "puja_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_addons" ADD CONSTRAINT "booking_addons_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_addons" ADD CONSTRAINT "booking_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "addons_slug_key" ON "addons" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "addons_active_idx" ON "addons" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "puja_addons_puja_idx" ON "puja_addons" USING btree ("puja_id");--> statement-breakpoint
CREATE INDEX "booking_addons_booking_idx" ON "booking_addons" USING btree ("booking_id");--> statement-breakpoint
ALTER TABLE "pujas" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "package_amount_in_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "addons_amount_in_paise" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "bookings" SET "package_amount_in_paise" = "amount_in_paise" WHERE "package_amount_in_paise" = 0;
