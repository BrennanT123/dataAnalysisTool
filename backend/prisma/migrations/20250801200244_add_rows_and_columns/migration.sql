/*
  Warnings:

  - You are about to drop the column `columns` on the `Dataset` table. All the data in the column will be lost.
  - You are about to drop the column `rows` on the `Dataset` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ColumnType" AS ENUM ('STRING', 'NUMBER', 'DATE', 'BOOLEAN');

-- AlterTable
ALTER TABLE "public"."Dataset" DROP COLUMN "columns",
DROP COLUMN "rows";

-- CreateTable
CREATE TABLE "public"."DatasetColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ColumnType" NOT NULL,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "DatasetColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DatasetRow" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatasetRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DatasetCell" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatasetCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatasetColumn_datasetId_idx" ON "public"."DatasetColumn"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetRow_datasetId_idx" ON "public"."DatasetRow"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetCell_rowId_idx" ON "public"."DatasetCell"("rowId");

-- CreateIndex
CREATE INDEX "DatasetCell_columnId_idx" ON "public"."DatasetCell"("columnId");

-- CreateIndex
CREATE INDEX "Dataset_userId_idx" ON "public"."Dataset"("userId");

-- CreateIndex
CREATE INDEX "SavedChart_userId_idx" ON "public"."SavedChart"("userId");

-- CreateIndex
CREATE INDEX "SavedChart_datasetId_idx" ON "public"."SavedChart"("datasetId");

-- AddForeignKey
ALTER TABLE "public"."DatasetColumn" ADD CONSTRAINT "DatasetColumn_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatasetRow" ADD CONSTRAINT "DatasetRow_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatasetCell" ADD CONSTRAINT "DatasetCell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "public"."DatasetRow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatasetCell" ADD CONSTRAINT "DatasetCell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "public"."DatasetColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
