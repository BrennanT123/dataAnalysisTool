import express from "express";
import * as dataController from "../controllers/dataController.js";
import * as authController from "../controllers/authController.js";
const dataRouter = express.Router();

dataRouter.get("/getData", authController.authenticateUserLoose, dataController.getUserDatasets);
dataRouter.post("/createDataset", authController.authenticateUser, dataController.createDataset);
dataRouter.get("/getDataset/:datasetId", authController.authenticateUser, dataController.getDatasetById);
dataRouter.delete("/deleteDataset/:datasetId", authController.authenticateUser, dataController.deleteDataset);
dataRouter.post("/updateDataset/:datasetId", authController.authenticateUser, dataController.updateDataSet);

export default dataRouter;
