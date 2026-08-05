-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCostMinor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingCountry" TEXT DEFAULT 'Sweden',
ADD COLUMN     "shippingCounty" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingRequired" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "counters" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("key")
);
