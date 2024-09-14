const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const pathToMenu = path.join(__dirname, "data", "menu.json");

const app = express();
const PORT = process.env.PORT || 3000;

// Load menu data from JSON file
let menu = [];
fs.readFile(pathToMenu, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading menu data:", err);
    return;
  }
  menu = JSON.parse(data);
});

// Enable CORS for all routes
app.use(cors());

// Enable JSON parsing in request body
app.use(express.json());

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Serve the menu data
app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// Handle order submission
app.post("/api/order", (req, res) => {
  const { order, totalCost, phone } = req.body;

  const orderDetails = order
    .map((item) => {
      const itemName = item.name || "Unknown Item";
      const itemSauce = item.sauce ? `with ${item.sauce}` : "";
      return `<li>${itemName} ${itemSauce}</li>`;
    })
    .join("");

  // Email content with the total cost included
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.CATERER_EMAIL,
    subject: "New Catering Order",
    html: `
      <h3>New order received</h3>
      <p><strong>Phone number:</strong> ${phone}</p>
      <p><strong>Order:</strong></p>
      <ul>${orderDetails}</ul>
      <p><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</p>
    `,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res
        .status(500)
        .send({ message: "Error sending order email", error });
    }
    console.log("Email sent:", info.response);
    res
      .status(200)
      .send({ message: "Order submitted and email sent successfully" });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
