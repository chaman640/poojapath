ALTER TABLE "bookings" ADD COLUMN "payment_provider" varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "provider_order_id" varchar(120);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "provider_payment_id" varchar(120);--> statement-breakpoint
UPDATE "bookings" SET "provider_order_id" = "razorpay_order_id", "provider_payment_id" = "razorpay_payment_id", "payment_provider" = 'razorpay' WHERE "razorpay_order_id" IS NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "bookings_rzp_order_key";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "razorpay_order_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "razorpay_payment_id";--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_provider_order_key" ON "bookings" USING btree ("provider_order_id");
