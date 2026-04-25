-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "openingHours" TEXT,
ADD COLUMN     "priceLevel" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emergencyContact" TEXT;

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "placeId" INTEGER NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "reviewerType" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
