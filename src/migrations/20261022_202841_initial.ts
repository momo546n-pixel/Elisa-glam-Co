import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "public"."enum_products_status" AS ENUM('published', 'draft');
  CREATE TYPE "public"."enum_products_fulfillment" AS ENUM('stock', 'made_to_order');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('received', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'paid', 'failed', 'cod_pending', 'refunded');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('wave', 'orange_money', 'card', 'cod');
  CREATE TYPE "public"."enum_delivery_zones_kind" AS ENUM('dakar', 'region', 'international');
  CREATE TYPE "public"."enum_promo_codes_type" AS ENUM('percent', 'fixed');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "public"."enum_homepage_commitments_icon" AS ENUM('craft', 'leather', 'senegal', 'delivery', 'exchange', 'secure');
  CREATE TYPE "public"."enum_homepage_section_order_section" AS ENUM('collections', 'featured', 'story', 'new', 'commitments', 'bestSellers', 'reviews');
  CREATE TYPE "public"."enum_faq_items_category" AS ENUM('sizes', 'materials', 'orders', 'payment', 'care', 'delivery');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"order" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"alt" varchar
  );
  
  CREATE TABLE "products_colors_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" varchar NOT NULL,
  	"stock" numeric DEFAULT 0 NOT NULL,
  	"sku" varchar,
  	"on_request" boolean
  );
  
  CREATE TABLE "products_colors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"hex" varchar DEFAULT '#141210',
  	"image_index" numeric
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"reference" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"short_description" varchar,
  	"description" varchar,
  	"status" "enum_products_status" DEFAULT 'published' NOT NULL,
  	"slug" varchar,
  	"is_new" boolean,
  	"featured" boolean,
  	"best_seller" boolean,
  	"is_demo" boolean DEFAULT false,
  	"price" numeric NOT NULL,
  	"sale_price" numeric,
  	"sale_start" timestamp(3) with time zone,
  	"sale_end" timestamp(3) with time zone,
  	"fulfillment" "enum_products_fulfillment" DEFAULT 'stock' NOT NULL,
  	"lead_time" varchar,
  	"materials" varchar,
  	"care" varchar,
  	"size_advice" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"product_name" varchar,
  	"reference" varchar,
  	"color" varchar,
  	"size" varchar,
  	"unit_price" numeric,
  	"quantity" numeric,
  	"made_to_order" boolean
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"status" "enum_orders_status" DEFAULT 'received' NOT NULL,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar,
  	"delivery_zone_id" integer,
  	"delivery_zone_name" varchar,
  	"address" varchar NOT NULL,
  	"landmark" varchar,
  	"customer_note" varchar,
  	"subtotal" numeric NOT NULL,
  	"discount" numeric DEFAULT 0,
  	"promo_code" varchar,
  	"delivery_fee" numeric DEFAULT 0,
  	"total" numeric NOT NULL,
  	"payment_method" "enum_orders_payment_method" NOT NULL,
  	"payment_provider" varchar,
  	"payment_reference" varchar,
  	"currency" varchar DEFAULT 'XOF',
  	"locale" varchar DEFAULT 'fr',
  	"whatsapp_confirmed" boolean,
  	"internal_note" varchar,
  	"stock_deducted" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "delivery_zones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"kind" "enum_delivery_zones_kind" DEFAULT 'dakar' NOT NULL,
  	"fee" numeric DEFAULT 0 NOT NULL,
  	"delay" varchar,
  	"cod_available" boolean DEFAULT false,
  	"active" boolean DEFAULT true,
  	"order" numeric DEFAULT 10,
  	"currency" varchar DEFAULT 'XOF',
  	"internal_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "promo_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"type" "enum_promo_codes_type" DEFAULT 'percent' NOT NULL,
  	"value" numeric NOT NULL,
  	"min_subtotal" numeric,
  	"expires_at" timestamp(3) with time zone,
  	"max_uses" numeric,
  	"used_count" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"intro" varchar,
  	"hero_image_id" integer,
  	"body" jsonb NOT NULL,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"product_id" integer NOT NULL,
  	"rating" numeric NOT NULL,
  	"comment" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"status" "enum_reviews_status" DEFAULT 'pending' NOT NULL,
  	"is_demo" boolean DEFAULT false,
  	"order_number" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar,
  	"email" varchar,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"handled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"products_id" integer,
  	"orders_id" integer,
  	"delivery_zones_id" integer,
  	"promo_codes_id" integer,
  	"pages_id" integer,
  	"reviews_id" integer,
  	"messages_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_name" varchar DEFAULT 'Elisa’glam&Co',
  	"tagline" varchar,
  	"whatsapp_number" varchar,
  	"phone" varchar,
  	"email" varchar,
  	"address" varchar,
  	"opening_hours" varchar,
  	"instagram" varchar,
  	"facebook" varchar,
  	"tiktok" varchar,
  	"enable_mobile_money" boolean DEFAULT true,
  	"enable_card" boolean DEFAULT false,
  	"enable_cod" boolean DEFAULT true,
  	"order_notification_email" varchar,
  	"free_shipping_threshold" numeric,
  	"ga4_id" varchar,
  	"meta_pixel_id" varchar,
  	"google_site_verification" varchar,
  	"default_seo_title" varchar,
  	"default_seo_description" varchar,
  	"og_image_id" integer,
  	"demo_mode" boolean DEFAULT false,
  	"default_currency" varchar DEFAULT 'XOF',
  	"default_locale" varchar DEFAULT 'fr',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_commitments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_homepage_commitments_icon" DEFAULT 'craft',
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "homepage_section_order" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" "enum_homepage_section_order_section" NOT NULL
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_image_id" integer,
  	"hero_eyebrow" varchar,
  	"hero_title" varchar,
  	"hero_subtitle" varchar,
  	"hero_cta_label" varchar DEFAULT 'Découvrir la collection',
  	"hero_cta_href" varchar DEFAULT '/boutique',
  	"selection_title" varchar DEFAULT 'La sélection',
  	"new_title" varchar DEFAULT 'Nouveautés',
  	"best_sellers_title" varchar DEFAULT 'Les plus demandées',
  	"story_title" varchar DEFAULT 'Notre histoire',
  	"story_text" varchar,
  	"story_image_id" integer,
  	"story_link_label" varchar DEFAULT 'Découvrir notre histoire',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" "enum_faq_items_category" DEFAULT 'orders',
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "size_guide_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eu" varchar NOT NULL,
  	"uk" varchar,
  	"us" varchar,
  	"foot_length_cm" varchar
  );
  
  CREATE TABLE "size_guide_tips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "size_guide" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro" varchar,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_images" ADD CONSTRAINT "products_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_colors_sizes" ADD CONSTRAINT "products_colors_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_colors" ADD CONSTRAINT "products_colors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_delivery_zones_fk" FOREIGN KEY ("delivery_zones_id") REFERENCES "public"."delivery_zones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_promo_codes_fk" FOREIGN KEY ("promo_codes_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_commitments" ADD CONSTRAINT "homepage_commitments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_section_order" ADD CONSTRAINT "homepage_section_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_story_image_id_media_id_fk" FOREIGN KEY ("story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "size_guide_rows" ADD CONSTRAINT "size_guide_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."size_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "size_guide_tips" ADD CONSTRAINT "size_guide_tips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."size_guide"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_image_idx" ON "categories" USING btree ("image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "products_images_order_idx" ON "products_images" USING btree ("_order");
  CREATE INDEX "products_images_parent_id_idx" ON "products_images" USING btree ("_parent_id");
  CREATE INDEX "products_images_image_idx" ON "products_images" USING btree ("image_id");
  CREATE INDEX "products_colors_sizes_order_idx" ON "products_colors_sizes" USING btree ("_order");
  CREATE INDEX "products_colors_sizes_parent_id_idx" ON "products_colors_sizes" USING btree ("_parent_id");
  CREATE INDEX "products_colors_order_idx" ON "products_colors" USING btree ("_order");
  CREATE INDEX "products_colors_parent_id_idx" ON "products_colors" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "products_reference_idx" ON "products" USING btree ("reference");
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_customer_phone_idx" ON "orders" USING btree ("customer_phone");
  CREATE INDEX "orders_delivery_zone_idx" ON "orders" USING btree ("delivery_zone_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "delivery_zones_updated_at_idx" ON "delivery_zones" USING btree ("updated_at");
  CREATE INDEX "delivery_zones_created_at_idx" ON "delivery_zones" USING btree ("created_at");
  CREATE UNIQUE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");
  CREATE INDEX "promo_codes_updated_at_idx" ON "promo_codes" USING btree ("updated_at");
  CREATE INDEX "promo_codes_created_at_idx" ON "promo_codes" USING btree ("created_at");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_hero_image_idx" ON "pages" USING btree ("hero_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "messages_updated_at_idx" ON "messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_delivery_zones_id_idx" ON "payload_locked_documents_rels" USING btree ("delivery_zones_id");
  CREATE INDEX "payload_locked_documents_rels_promo_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("promo_codes_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("messages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");
  CREATE INDEX "homepage_commitments_order_idx" ON "homepage_commitments" USING btree ("_order");
  CREATE INDEX "homepage_commitments_parent_id_idx" ON "homepage_commitments" USING btree ("_parent_id");
  CREATE INDEX "homepage_section_order_order_idx" ON "homepage_section_order" USING btree ("_order");
  CREATE INDEX "homepage_section_order_parent_id_idx" ON "homepage_section_order" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_image_idx" ON "homepage" USING btree ("hero_image_id");
  CREATE INDEX "homepage_story_image_idx" ON "homepage" USING btree ("story_image_id");
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_products_id_idx" ON "homepage_rels" USING btree ("products_id");
  CREATE INDEX "faq_items_order_idx" ON "faq_items" USING btree ("_order");
  CREATE INDEX "faq_items_parent_id_idx" ON "faq_items" USING btree ("_parent_id");
  CREATE INDEX "size_guide_rows_order_idx" ON "size_guide_rows" USING btree ("_order");
  CREATE INDEX "size_guide_rows_parent_id_idx" ON "size_guide_rows" USING btree ("_parent_id");
  CREATE INDEX "size_guide_tips_order_idx" ON "size_guide_tips" USING btree ("_order");
  CREATE INDEX "size_guide_tips_parent_id_idx" ON "size_guide_tips" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "products_images" CASCADE;
  DROP TABLE "products_colors_sizes" CASCADE;
  DROP TABLE "products_colors" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "delivery_zones" CASCADE;
  DROP TABLE "promo_codes" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "messages" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "homepage_commitments" CASCADE;
  DROP TABLE "homepage_section_order" CASCADE;
  DROP TABLE "homepage" CASCADE;
  DROP TABLE "homepage_rels" CASCADE;
  DROP TABLE "faq_items" CASCADE;
  DROP TABLE "faq" CASCADE;
  DROP TABLE "size_guide_rows" CASCADE;
  DROP TABLE "size_guide_tips" CASCADE;
  DROP TABLE "size_guide" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_products_fulfillment";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_delivery_zones_kind";
  DROP TYPE "public"."enum_promo_codes_type";
  DROP TYPE "public"."enum_reviews_status";
  DROP TYPE "public"."enum_homepage_commitments_icon";
  DROP TYPE "public"."enum_homepage_section_order_section";
  DROP TYPE "public"."enum_faq_items_category";`)
}
