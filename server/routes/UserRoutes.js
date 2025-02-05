const express = require("express");
const router = express.Router();
const UserController = require("../controller/UserController");
const auth = require("../middleware/auth");

// Register a new user
router.post("/register", UserController.register);

// Login a user
router.post("/login", UserController.login);

// Get all users (protected route)
router.get("/", auth, UserController.index);

// Get a user by ID (protected route)
router.get("/:id", auth, UserController.find);

// Update a user (protected route)
router.put("/:id", auth, UserController.update);

// Delete a user (protected route)
router.delete("/:id", auth, UserController.remove);

module.exports = router;
