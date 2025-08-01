import request from "supertest";
import app from "../app.js";
import { authenticateUser } from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "../generated/prisma/index.js";
dotenv.config();

describe("POST login routes", () => {
  test("should say user Account with email already exists.", async () => {
    const res = await request(app).post("/loginRouter/register").send({
      user_email: `testaccount@fakeemail.com`,
      password: "TestAccount1!",
      confirm_password: "TestAccount1!",
      first_name: "Test",
      last_name: "User",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toHaveProperty(
      "msg",
      "Account with email already exists."
    );
  });
  //   test("should register a new user", async () => {
  //     const res = await request(app)
  //       .post("/loginRouter/register")
  //       .send({
  //         user_email: `test${Date.now()}@example.com`,
  //         password: "Secure1!",
  //         confirm_password: "Secure1!",
  //         first_name: "Test",
  //         last_name: "User",
  //       });

  //     expect(res.statusCode).toBe(201);
  //     expect(res.body).toHaveProperty("msg", "User registered successfully");
  //     expect(res.body).toHaveProperty("user");
  //     expect(res.body.user).toHaveProperty("email", expect.any(String));
  //   });

  test("should login the user", async () => {
    const email = `testaccount@fakeemail.com`;
    const password = "TestAccount1!";
    const res = await request(app)
      .post("/loginRouter/login")
      .send({ email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Login successful");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", email);
  });
});

app.get("/protected", authenticateUser, (req, res) => {
  res.status(200).json({ msg: "Access granted", user: req.user });
});

describe("authenticateUser middleware", () => {
  const secret = process.env.JWT_SECRET;

  test("should allow access with a valid token", async () => {
    const validToken = jwt.sign(
      { id: "123", email: "test@example.com" },
      secret,
      {
        expiresIn: "1h",
      }
    );

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Access granted");
    expect(res.body.user).toMatchObject({
      id: "123",
      email: "test@example.com",
    });
  });

  test("should block access with no token", async () => {
    const res = await request(app).get("/protected");

    expect(res.statusCode).toBe(401);
    expect(res.body.errors[0]).toHaveProperty(
      "msg",
      "No token provided or bad authorization format"
    );
  });

  test("should block access with invalid token", async () => {
    const res = await request(app)
      .get("/protected")
      .set("Authorization", "Bearer bad.token.here");

    expect(res.statusCode).toBe(401);
    expect(res.body.errors[0]).toHaveProperty(
      "msg",
      "Invalid or expired token"
    );
  });
});

describe("get data routes", () => {
  test("should retrieve user datasets", async () => {
    const email = `testaccount@fakeemail.com`;
    const secret = process.env.JWT_SECRET;

    const validToken = jwt.sign(
      { id: "cmdt8elrs0000355hs8mj067x", email: email },
      secret,
      {
        expiresIn: "1h",
      }
    );

    const res = await request(app)
      .get("/dataRouter/getData")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Dataset retrieval successful");
  });

  test("should signal that the user is not logged in ", async () => {
    const res = await request(app).get("/dataRouter/getData");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "You are not logged in.");
  });
});

describe("create dataset route", () => {
  let datasetId;
  test("should create a new dataset", async () => {
    const email = `testaccount@fakeemail.com`;
    const secret = process.env.JWT_SECRET;
    const prisma = new PrismaClient();
    const userId = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true },
    });
    console.log("User ID:", userId.id);
    const validToken = jwt.sign({ id: userId.id, email: email }, secret, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .post("/dataRouter/createDataset")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        name: "Test Dataset",
        columns: [
          { name: "Column1", type: "STRING" },
          { name: "Column2", type: "NUMBER" },
        ],
        rows: [
          { Column1: "Row1Data1", Column2: 123 },
          { Column1: "Row2Data1", Column2: 456 },
        ],
      });
    if (res.statusCode !== 201) {
      console.error("Status:", res.statusCode);
      console.error("Response body:", res.body);
    }
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("msg", "Dataset created successfully");
    datasetId = res.body.datasetId;
  });
  test("should update a dataset by ID", async () => {
    const email = `testaccount@fakeemail.com`;
    console.log("datasetID" + datasetId);
    const secret = process.env.JWT_SECRET;
    const prisma = new PrismaClient();
    const userId = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true },
    });
    console.log("User ID:", userId.id);
    const validToken = jwt.sign({ id: userId.id, email: email }, secret, {
      expiresIn: "1h",
    });
    console.log(datasetId);
    const res = await request(app)
      .post(`/dataRouter/updateDataset/${datasetId}`)
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        name: "Updated Dataset",
        columns: [
          { name: "Column1.0", type: "STRING" },
          { name: "Column2", type: "STRING" },
          { name: "Column3", type: "NUMBER" },
        ],
        rows: [
          {
            cells: [
              { columnName: "Column1", value: "Row1Data1.0" },
              { columnName: "Column2", value: "123" },
              { columnName: "Column3", value: 1 },
            ],
          },
          {
            cells: [
              { columnName: "Column1", value: "Row2Data1" },
              { columnName: "Column2", value: "456" },
              { columnName: "Column3", value: 2 },
            ],
          },
          {
            cells: [
              { columnName: "Column1", value: "Row3Data1" },
              { columnName: "Column2", value: "789" },
              { columnName: "Column3", value: 3 },
            ],
          },
        ],
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("msg", "Dataset updated successfully");
  });
  test("should get a dataset by ID", async () => {
    const email = `testaccount@fakeemail.com`;
    console.log("datasetID" + datasetId);
    const secret = process.env.JWT_SECRET;
    const prisma = new PrismaClient();
    const userId = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true },
    });
    console.log("User ID:", userId.id);
    const validToken = jwt.sign({ id: userId.id, email: email }, secret, {
      expiresIn: "1h",
    });
    const res = await request(app)
      .get(`/dataRouter/getDataset/${datasetId}`)
      .set("Authorization", `Bearer ${validToken}`);
    if (res.statusCode === 404) {
      console.log(res.body.datasetIdSent);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Dataset retrieved successfully");
    const dataset = res.body.dataset;
    const column3 = dataset.columns.find((col) => col.name === "Column3");
    const firstRow = dataset.rows[0];
    const cell = firstRow.cells.find((c) => c.columnId === column3.id);

    expect(cell.value).toBe("1");
  });

  test("should delete a dataset by ID", async () => {
    const email = `testaccount@fakeemail.com`;
    console.log("datasetID for delete" + datasetId);
    const secret = process.env.JWT_SECRET;
    const prisma = new PrismaClient();
    const userId = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true },
    });
    console.log("User ID:", userId.id);
    const validToken = jwt.sign({ id: userId.id, email: email }, secret, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .delete(`/dataRouter/deleteDataset/${datasetId}`)
      .set("Authorization", `Bearer ${validToken}`);
    if (res.statusCode === 404) {
      console.log(res.body.datasetIdSent);
    }
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("msg", "Dataset deleted successfully");
  });
});
