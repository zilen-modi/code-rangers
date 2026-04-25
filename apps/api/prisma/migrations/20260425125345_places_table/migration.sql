-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('HOTEL', 'RESTAURANT');

-- CreateTable
CREATE TABLE "Place" (
    "id" SERIAL NOT NULL,
    "type" "PlaceType" NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);
