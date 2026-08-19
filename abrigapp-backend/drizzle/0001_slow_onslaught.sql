CREATE TABLE "support_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"city" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'Aplicado' NOT NULL,
	"magic_token" varchar(255),
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"support_type" varchar(255),
	"youtube_url" varchar(1024),
	"image_urls" text,
	"donation_account" text,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "volunteers_email_unique" UNIQUE("email")
);
