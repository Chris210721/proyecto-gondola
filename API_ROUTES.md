# API Documentation

## API Endpoints

### User Management

#### `POST /api/users`
- **Description**: Create a new user.
- **Request Body**: `{ "username":"string", "password":"string" }`
- **Response**: `201 Created`

#### `GET /api/users/:id`
- **Description**: Get user details by ID.
- **Response**: `200 OK`

### Product Management

#### `GET /api/products`
- **Description**: Retrieve a list of products.
- **Response**: `200 OK`

#### `POST /api/products`
- **Description**: Create a new product.
- **Request Body**: `{ "name":"string", "price": number }`
- **Response**: `201 Created`

### Orders

#### `GET /api/orders`
- **Description**: Retrieve a list of orders.
- **Response**: `200 OK`

#### `POST /api/orders`
- **Description**: Create a new order.
- **Request Body**: `{ "userId": number, "productIds": [number] }`
- **Response**: `201 Created`

### Authentication

#### `POST /api/auth/login`
- **Description**: Log in a user.
- **Request Body**: `{ "username":"string", "password":"string" }`
- **Response**: `200 OK, { "token":"string" }`

### Example Response Structure

- For User Creation:
```json
{
  "id": 1,
  "username": "string"
}
```

- For Product Retrieval:
```json
[
  {
    "id": 1,
    "name": "string",
    "price": number
  }
]
```

- For Order Creation:
```json
{
  "orderId": 1,
  "status": "string"
}
```

---

_Last Updated: 2026-04-13 17:03:36 UTC_