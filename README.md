# PeopleX Test Backend

## Prerequisites
- Node.js v18+ (recommended)
- MongoDB Atlas account or local MongoDB instance
- npm v9+

## Setup Instructions
1. Clone this repository: `git clone <repository-url>`
2. Install dependencies: `npm install`
3. Create `.env` file with your MongoDB URI (see `.env.example`)
4. Start development server: `npm run dev`
5. The server will be running on `http://localhost:3000`

## API Documentation

| Route | Method | Description | Request Body | Sample Response |
|-------|--------|-------------|--------------|-----------------|
| `/api/analytics` | GET | Get sales analytics | None | `{ "totalSales": 1000, "topProducts": [...] }` |
| `/api/analytics/top-customers` | GET | Get top customers by sales | None | `[{ "customerId": "C001", "totalSpent": 500 }]` |
| `/api/analytics/sales-by-region` | GET | Get sales by region | None | `[{ "region": "North", "totalSales": 300 }]` |
| `/api/refresh` | POST | Refresh data from CSV | None | `{ "message": "Data refreshed successfully" }` |

## Database Schema

The database consists of three main collections with the following structure:

### Customers
```
{
  customerId: String (required, unique)
  name: String
  email: String
  address: String
  demographics: Mixed
}
```

### Products
```
{
  productId: String (required, unique)
  name: String
  category: String
  description: String
  price: Number
}
```

### Orders
```
{
  orderId: String (required, unique)
  customer: String (ref: Customer)
  products: [
    {
      product: String (ref: Product)
      quantity: Number
      unitPrice: Number
      discount: Number
      shippingCost: Number
    }
  ]
  region: String
  paymentMethod: String
  orderDate: Date
  totalAmount: Number
}
```

Each order references a customer and contains one or more products with their quantities and pricing details.