const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  customerId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  address: String,
  demographics: mongoose.Schema.Types.Mixed // for extensibility
});

const ProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: String,
  category: String,
  description: String,
  price: Number
});

const OrderProductSchema = new mongoose.Schema({
  product: { type: String, ref: 'Product' },
  quantity: Number,
  unitPrice: Number,
  discount: Number,
  shippingCost: Number
}, {_id: false});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: { type: String, ref: 'Customer', required: true },
  products: [OrderProductSchema],
  region: String,
  paymentMethod: String,
  orderDate: Date,
  totalAmount: Number
});

const Customer = mongoose.model('Customer', CustomerSchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);

module.exports = { Customer, Product, Order };