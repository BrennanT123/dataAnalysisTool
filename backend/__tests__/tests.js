import request from "supertest";
import app from "../app.js";

describe("POST login routes", () => {
  test("should register a new user", async () => {
    const res = await request(app)
      .post("/loginRouter/register")
      .send({
        user_email: `test${Date.now()}@example.com`,
        password: "Secure1!",
        confirm_password: "Secure1!",
        first_name: "Test",
        last_name: "User",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "User registered successfully");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", expect.any(String));
  });

  test("should login the user", async () => {
    const email = `testaccount@fakeemail.com`;
    const password = "TestAccount1!";
    const res = await request(app)
      .post("/loginRouter/login")
      .send({ email, password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", email);
  });
});
