// Standard Node.js modules and dependencies
const fs = require('fs');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const { Customer, Product, Order } = require('../models/schemas');
require('dotenv').config();

// Use environment variable or fallback for MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salesdb';

// Connect to MongoDB with basic error handling
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB for CSV import'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Helper to parse a number safely
function safeNumber(val, fallback = 0) {
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

// Helper to parse an integer safely
function safeInt(val, fallback = 0) {
  const num = parseInt(val);
  return isNaN(num) ? fallback : num;
}

// Main import function
async function importCsv(csvFilePath) {
  // We'll use Maps to avoid duplicate customers/products
  const customerMap = new Map();
  const productMap = new Map();
  const orderList = [];

  // Read and parse the CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csvParser())
    .on('data', (row) => {
      // For debugging: see each row as it's read
      // console.log('Processing row:', row);

      // Build customer object and add to map
      customerMap.set(row["Customer ID"], {
        customerId: row["Customer ID"],
        name: row["Customer Name"],
        email: row["Customer Email"],
        address: row["Customer Address"],
        demographics: row["Customer Demographics"] || {}
      });

      // Build product object and add to map
      productMap.set(row["Product ID"], {
        productId: row["Product ID"],
        name: row["Product Name"],
        category: row["Category"],
        description: row["Product Description"] || "",
        price: safeNumber(row["Unit Price"])
      });

      // Parse and validate order date
      const parsedOrderDate = new Date(row["Date of Sale"]);
      if (isNaN(parsedOrderDate.valueOf())) {
        console.warn(`Skipping row with invalid date: ${row["Date of Sale"]} (Order ID: ${row["Order ID"]})`);
        return;
      }

      // Build order object
      const order = {
        orderId: row["Order ID"],
        customer: row["Customer ID"],
        products: [{
          product: row["Product ID"],
          quantity: safeInt(row["Quantity Sold"]),
          unitPrice: safeNumber(row["Unit Price"]),
          discount: safeNumber(row["Discount"]),
          shippingCost: safeNumber(row["Shipping Cost"])
        }],
        region: row["Region"],
        paymentMethod: row["Payment Method"],
        orderDate: parsedOrderDate,
        totalAmount: (safeInt(row["Quantity Sold"]) * safeNumber(row["Unit Price"])) * (1 - safeNumber(row["Discount"])) + safeNumber(row["Shipping Cost"])
      };
      // For debugging: see the order object
      // console.log('Order to insert:', order);
      orderList.push(order);
    })
    .on('end', async () => {
      // All rows have been processed, now update the database
      try {
        // Clear out old data (be careful in production!)
        await Customer.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        // Insert new data
        await Customer.insertMany(Array.from(customerMap.values()));
        await Product.insertMany(Array.from(productMap.values()));
        await Order.insertMany(orderList);
        console.log('CSV data imported successfully.');
      } catch (err) {
        console.error('Error importing CSV data:', err);
      } finally {
        // If you want to close the DB connection after import, uncomment below:
        // mongoose.disconnect();
      }
    })
    .on('error', (err) => {
      // Handle file read/parse errors
      console.error('Error reading CSV file:', err);
    });
}

// If run directly from the command line, expect a file path argument
if (require.main === module) {
  const csvFilePath = process.argv[2];
  if (!csvFilePath) {
    console.error('Please provide the path to the CSV file.');
    process.exit(1);
  }
  importCsv(csvFilePath);
}

// Export for use in other modules
module.exports = importCsv;