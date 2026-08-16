CREATE TYPE "public"."booking_status" AS ENUM('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PERFORMED', 'VIDEO_SENT', 'PRASAD_DISPATCHED', 'COMPLETED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('NOT_STARTED', 'CREATED', 'CAPTURED', 'FAILED', 'REFUNDED', 'DEMO_SKIPPED');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(200) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(30) DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"token_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_events" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"status" "booking_status" NOT NULL,
	"message_en" text NOT NULL,
	"message_hi" text NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_code" varchar(40) NOT NULL,
	"puja_id" text NOT NULL,
	"package_id" text NOT NULL,
	"devotee_name" varchar(120) NOT NULL,
	"gotra" varchar(80) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(200),
	"member_names" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"sankalp" text,
	"address_line" varchar(300),
	"city" varchar(120),
	"state" varchar(120),
	"pincode" varchar(10),
	"amount_in_paise" integer NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"razorpay_order_id" varchar(80),
	"razorpay_payment_id" varchar(80),
	"video_url" text,
	"prasad_tracking" varchar(120),
	"admin_note" text,
	"whatsapp_opt_in" boolean DEFAULT true NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name_en" varchar(160) NOT NULL,
	"name_hi" varchar(160) NOT NULL,
	"icon" varchar(40) DEFAULT 'om' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(200),
	"subject" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"question_en" text NOT NULL,
	"question_hi" text NOT NULL,
	"answer_en" text NOT NULL,
	"answer_hi" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title_en" varchar(220) NOT NULL,
	"title_hi" varchar(220) NOT NULL,
	"desc_en" text DEFAULT '' NOT NULL,
	"desc_hi" text DEFAULT '' NOT NULL,
	"temple_name_en" varchar(200) DEFAULT '' NOT NULL,
	"temple_name_hi" varchar(200) DEFAULT '' NOT NULL,
	"price_in_paise" integer NOT NULL,
	"art_key" varchar(40) DEFAULT 'kalash' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" text PRIMARY KEY NOT NULL,
	"puja_id" text NOT NULL,
	"name_en" varchar(160) NOT NULL,
	"name_hi" varchar(160) NOT NULL,
	"price_in_paise" integer NOT NULL,
	"mrp_in_paise" integer,
	"max_members" integer DEFAULT 1 NOT NULL,
	"features_en" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"features_hi" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"name_hi" varchar(200) NOT NULL,
	"desc_en" text DEFAULT '' NOT NULL,
	"desc_hi" text DEFAULT '' NOT NULL,
	"price_in_paise" integer NOT NULL,
	"mrp_in_paise" integer,
	"art_key" varchar(40) DEFAULT 'rudraksh' NOT NULL,
	"group_en" varchar(120) DEFAULT 'Puja Samagri' NOT NULL,
	"group_hi" varchar(120) DEFAULT 'पूजा सामग्री' NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pujas" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title_en" varchar(250) NOT NULL,
	"title_hi" varchar(250) NOT NULL,
	"subtitle_en" varchar(300) DEFAULT '' NOT NULL,
	"subtitle_hi" varchar(300) DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"description_hi" text DEFAULT '' NOT NULL,
	"benefits_en" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"benefits_hi" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"rituals_en" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"rituals_hi" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"art_key" varchar(40) DEFAULT 'om' NOT NULL,
	"puja_date" timestamp with time zone NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"seats_total" integer,
	"seats_booked" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"category_id" text,
	"temple_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temples" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name_en" varchar(200) NOT NULL,
	"name_hi" varchar(200) NOT NULL,
	"city_en" varchar(120) NOT NULL,
	"city_hi" varchar(120) NOT NULL,
	"state_en" varchar(120) NOT NULL,
	"state_hi" varchar(120) NOT NULL,
	"about_en" text DEFAULT '' NOT NULL,
	"about_hi" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"city" varchar(120) NOT NULL,
	"text_en" text NOT NULL,
	"text_hi" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_puja_id_pujas_id_fk" FOREIGN KEY ("puja_id") REFERENCES "public"."pujas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_puja_id_pujas_id_fk" FOREIGN KEY ("puja_id") REFERENCES "public"."pujas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pujas" ADD CONSTRAINT "pujas_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pujas" ADD CONSTRAINT "pujas_temple_id_temples_id_fk" FOREIGN KEY ("temple_id") REFERENCES "public"."temples"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "booking_events_booking_idx" ON "booking_events" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_code_key" ON "bookings" USING btree ("booking_code");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_rzp_order_key" ON "bookings" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "bookings_phone_idx" ON "bookings" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_created_idx" ON "bookings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "contact_read_idx" ON "contact_messages" USING btree ("is_read","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "offerings_slug_key" ON "offerings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "packages_puja_idx" ON "packages" USING btree ("puja_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_key" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "pujas_slug_key" ON "pujas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pujas_active_date_idx" ON "pujas" USING btree ("is_active","puja_date");--> statement-breakpoint
CREATE INDEX "pujas_featured_idx" ON "pujas" USING btree ("is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "temples_slug_key" ON "temples" USING btree ("slug");