import { PrismaClient } from "../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const getUserDatasets = async (req, res) => {
  if (req.isLoggedIn === false) {
    return res.status(200).json({
      msg: "You are not logged in.",
    });
  }
  const userId = req.user.id;
  try {
    const datasets = await prisma.dataset.findMany({
      where: { userId: userId },
      include: { savedCharts: true },
    });
    return res
      .status(200)
      .json({ msg: "Dataset retrieval successful", datasets: datasets });
  } catch (error) {
    console.error("Error fetching user datasets:", error);
    return res.status(500).json({
      errors: [{ msg: "Internal server error. Please try again later." }],
    });
  }
};

export const createDataset = async (req, res) => {
  const userId = req.user?.id;
  const { name, columns, rows } = req.body;

  if (!userId || !name || !Array.isArray(columns) || !Array.isArray(rows)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const dataset = await prisma.dataset.create({
      data: {
        name,
        userId,
      },
    });

    //create columns
    const createdColumns = await Promise.all(
      columns.map((col) =>
        prisma.datasetColumn.create({
          data: {
            name: col.name,
            type: col.type,
            datasetId: dataset.id,
          },
        })
      )
    );
    const columnIdMap = {};
    createdColumns.forEach((col) => {
      columnIdMap[col.name] = col.id;
    });

    //create rows and cells
    for (const rowData of rows) {
      const row = await prisma.datasetRow.create({
        data: {
          datasetId: dataset.id,
        },
      });

      for (const [colName, value] of Object.entries(rowData)) {
        const columnId = columnIdMap[colName];
        if (!columnId) continue; //skip if the column name doesn't exist

        await prisma.datasetCell.create({
          data: {
            rowId: row.id,
            columnId,
            value: String(value),
          },
        });
      }
    }

    return res
      .status(201)
      .json({ msg: "Dataset created successfully", datasetId: dataset.id });
  } catch (error) {
    console.error("Error creating dataset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getDatasetById = async (req, res) => {
  const datasetId = req.params.datasetId;
  const userId = req.user?.id;
  if (!userId || !datasetId) {
    return res.status(400).json({ error: "Invalid input" });
  }
  try {
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: userId },
      include: {
        columns: true,
        rows: {
          include: {
            cells: true,
          },
        },
      },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    return res
      .status(200)
      .json({ msg: "Dataset retrieved successfully", dataset });
  } catch (error) {
    console.error("Error retrieving dataset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteDataset = async (req, res) => {
  const datasetId = req.params.datasetId;
  const userId = req.user?.id;
  if (!userId || !datasetId) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    //ceck if the dataset belongs to the user
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId, userId: userId },
    });

    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    //delete the dataset and its related data
    await prisma.dataset.delete({
      where: { id: datasetId },
    });

    return res.status(200).json({ msg: "Dataset deleted successfully" });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateDataSet = async (req, res) => {
  const userId = req.user?.id;
  const datasetId = req.params.datasetId;
  const { name, columns, rows } = req.body;

  if (!userId || !datasetId) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    //check if the dataset belongs to the user
    const dataset = await prisma.dataset.findFirst({
      where: { id: datasetId, userId: userId },
    });

    if (!dataset) {
      return res
        .status(404)
        .json({ error: "Dataset not found", datasetIdSent: datasetId });
    }

    //run all updates in a transaction
    await prisma.$transaction(async (tx) => {
      //update the dataset name
      await tx.dataset.update({
        where: { id: datasetId },
        data: { name },
      });

      //handle columns
      const existingColumns = await tx.datasetColumn.findMany({
        where: { datasetId },
      });

      const incomingColIds = [];
      for (const col of columns) {
        if (col.id) {
          //existing column, update it
          incomingColIds.push(col.id);
          await tx.datasetColumn.update({
            where: { id: col.id },
            data: { name: col.name, type: col.type },
          });
        } else {
          //new column, create it
          const newCol = await tx.datasetColumn.create({
            data: {
              name: col.name,
              type: col.type,
              datasetId,
            },
          });
          incomingColIds.push(newCol.id);
          col.id = newCol.id; //ensure future use knows the ID
        }
      }

      //deelete columns no longer present
      const removedCols = existingColumns.filter(
        (c) => !incomingColIds.includes(c.id)
      );
      await tx.datasetColumn.deleteMany({
        where: { id: { in: removedCols.map((c) => c.id) } },
      });

      //handle rows
      const existingRows = await tx.datasetRow.findMany({
        where: { datasetId },
      });

      const incomingRowIds = [];
      for (const row of rows) {
        let rowId;

        if (row.id) {
          //existing row
          rowId = row.id;
          incomingRowIds.push(rowId);
          await tx.datasetRow.update({
            where: { id: rowId },
            data: {}, // Update if needed
          });
        } else {
          //new row
          const newRow = await tx.datasetRow.create({
            data: { datasetId },
          });
          rowId = newRow.id;
          incomingRowIds.push(rowId);
        }

        //clear old cells for this row
        await tx.datasetCell.deleteMany({ where: { rowId } });

        //add new cells
        for (const cell of row.cells) {
          const columnId =
            cell.columnId ||
            columns.find((c) => c.name === cell.columnName)?.id;

          if (!columnId) continue;

          await tx.datasetCell.create({
            data: {
              rowId,
              columnId,
              value: String(cell.value),
            },
          });
        }
      }

      //delete rows that were removed
      const removedRows = existingRows.filter(
        (r) => !incomingRowIds.includes(r.id)
      );
      await tx.datasetRow.deleteMany({
        where: { id: { in: removedRows.map((r) => r.id) } },
      });
    });

    return res.status(201).json({ msg: "Dataset updated successfully" });
  }catch (error) {
  console.error("Error updating dataset:", error);
  console.error(error.stack); // ADD THIS LINE
  return res.status(500).json({ error: "Internal server error" });
}
};
