const express = require('express');
const router = express.Router();
const { Order, Product, Customer } = require('../models/schemas');

// Total Revenue (optionally by date range)
router.get('/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);
    res.json({ totalRevenue: result[0]?.totalRevenue || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Total Revenue by Product
router.get('/revenue/by-product', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $group: {
        _id: "$products.product",
        totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.unitPrice", { $subtract: [1, "$products.discount"] }] } },
        totalSold: { $sum: "$products.quantity" }
      } },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Total Revenue by Category
router.get('/revenue/by-category', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" },
      { $group: {
        _id: "$product.category",
        totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.unitPrice", { $subtract: [1, "$products.discount"] }] } },
        totalSold: { $sum: "$products.quantity" }
      } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Total Revenue by Region
router.get('/revenue/by-region', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $group: {
        _id: "$region",
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 }
      } }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top N Products Overall
router.get('/top-products', async (req, res) => {
  try {
    const { n = 5, startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $group: {
        _id: "$products.product",
        totalSold: { $sum: "$products.quantity" }
      } },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(n) },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top N Products by Category
router.get('/top-products/by-category', async (req, res) => {
  try {
    const { n = 5, category, startDate, endDate } = req.query;
    console.log(category);
    if (!category) return res.status(400).json({ error: 'category is required' });
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" },
      { $match: { "product.category": category } },
      { $group: {
        _id: "$products.product",
        totalSold: { $sum: "$products.quantity" }
      } },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(n) },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top N Products by Region
router.get('/top-products/by-region', async (req, res) => {
  try {
    const { n = 5, region, startDate, endDate } = req.query;
    if (!region) return res.status(400).json({ error: 'region is required' });
    const match = { region };
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $group: {
        _id: "$products.product",
        totalSold: { $sum: "$products.quantity" }
      } },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(n) },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Analysis: Total Customers, Orders, Avg Order Value
router.get('/customer-analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate);
      if (endDate) match.orderDate.$lte = new Date(endDate);
    }
    const totalCustomers = await Order.distinct('customer', match);
    const totalOrders = await Order.countDocuments(match);
    const avgOrderValueAgg = await Order.aggregate([
      { $match: match },
      { $group: { _id: null, avgOrderValue: { $avg: "$totalAmount" } } }
    ]);
    res.json({
      totalCustomers: totalCustomers.length,
      totalOrders,
      avgOrderValue: avgOrderValueAgg[0]?.avgOrderValue || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example analytics endpoint: sales by product
router.get('/salesbyproduct', async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $unwind: "$products" },
      { $group: {
        _id: "$products.product",
        totalSold: { $sum: "$products.quantity" },
        totalRevenue: { $sum: "$totalAmount" }
      } },
      { $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "productId",
        as: "product"
      } },
      { $unwind: "$product" }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example analytics endpoint: sales by customer
router.get('/salesbycustomer', async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $group: {
        _id: "$customer",
        totalSpent: { $sum: "$totalAmount" },
        orders: { $sum: 1 }
      } },
      { $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "customerId",
        as: "customer"
      } },
      { $unwind: "$customer" }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to refresh/re-import data (calls importCsv)
router.post('/refresh', async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath is required' });
  try {
    const importCsv = require('../utils/importCsv');
    await importCsv(filePath);
    res.json({ message: 'Data refreshed from CSV.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;