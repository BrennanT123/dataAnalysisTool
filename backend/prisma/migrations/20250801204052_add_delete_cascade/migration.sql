-- DropForeignKey
ALTER TABLE "public"."DatasetCell" DROP CONSTRAINT "DatasetCell_columnId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DatasetCell" DROP CONSTRAINT "DatasetCell_rowId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DatasetColumn" DROP CONSTRAINT "DatasetColumn_datasetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DatasetRow" DROP CONSTRAINT "DatasetRow_datasetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SavedChart" DROP CONSTRAINT "SavedChart_datasetId_fkey";

-- AddForeignKey
ALTER TABLE "public"."DatasetColumn" ADD CONSTRAINT "DatasetColumn_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatasetRow" ADD CONSTRAINT "DatasetRow_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatasetCell" ADD CONSTRAINT "DatasetCell_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "public"."DatasetRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatasetCell" ADD CONSTRAINT "DatasetCell_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "public"."DatasetColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedChart" ADD CONSTRAINT "SavedChart_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "public"."Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
