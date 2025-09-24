# MV Traders B2B Marketplace Backend

A FastAPI-based B2B marketplace backend with role-based access control, JWT authentication, and SQLModel ORM.

## Features

- **Authentication**: JWT-based authentication with phone number and password
- **Role-based Access Control**: SuperAdmin, Admin, User, and AppAdmin roles
- **Organization Management**: Support for Vendors, Companies, and AppOwner
- **Product Management**: CRUD operations for products and units
- **Order Management**: Complete order lifecycle with approval workflows
- **Document Management**: Invoice and document handling
- **Audit Trail**: Order item history tracking

## Default Credentials

- **Phone Number**: 9999999999
- **Password**: admin123
- **Role**: AppAdmin (AppOwner organization)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python main.py
```

3. Access the API documentation at: http://localhost:8000/docs

## API Endpoints

### Authentication
- `POST /auth/login` - Login with phone number and password
- `GET /auth/me` - Get current user profile
- `POST /auth/register` - Register new user (SuperAdmin/Admin only)

### Users
- `GET /users/` - List users in organization
- `POST /users/` - Create new user
- `GET /users/{user_id}` - Get user by ID
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user

### Organizations
- `GET /organizations/` - List organizations (AppOwner only)
- `POST /organizations/` - Create organization (AppOwner only)
- `GET /organizations/{id}` - Get organization by ID
- `PUT /organizations/{id}` - Update organization
- `DELETE /organizations/{id}` - Delete organization

### Products
- `GET /products/` - List products
- `POST /products/` - Create product (Vendor SuperAdmin/Admin only)
- `GET /products/{id}` - Get product by ID
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product

### Units
- `GET /units/` - List units
- `POST /units/` - Create unit (Vendor SuperAdmin/Admin only)
- `GET /units/{id}` - Get unit by ID
- `PUT /units/{id}` - Update unit
- `DELETE /units/{id}` - Delete unit

### Orders
- `GET /orders/` - List orders
- `POST /orders/` - Create order (Company SuperAdmin/Admin only)
- `POST /orders/request-approval` - Request order approval (Company Users)
- `PUT /orders/{id}/approve` - Approve order
- `PUT /orders/{id}/accept` - Accept order (Vendor)
- `PUT /orders/{id}/status` - Update order status

### Order Items
- `GET /order-items/` - List order items
- `POST /order-items/` - Create order item
- `PUT /order-items/{id}/status` - Update item status
- `GET /order-items/{id}/history` - Get item history

### Invoices
- `GET /invoices/` - List invoices (SuperAdmin/Admin only)
- `POST /invoices/` - Create invoice
- `GET /invoices/{id}` - Get invoice by ID
- `DELETE /invoices/{id}` - Delete invoice

### Documents
- `GET /documents/` - List documents (SuperAdmin/Admin only)
- `POST /documents/` - Upload document
- `GET /documents/{id}` - Get document by ID
- `DELETE /documents/{id}` - Delete document

## Permission Matrix

| Role | Organization | Can Create Org | Can Place Orders | Can Approve Orders | Can See Prices/Invoices |
|------|-------------|---------------|-----------------|-------------------|------------------------|
| AppAdmin | AppOwner | ✅ | ❌ | ❌ | ✅ |
| SuperAdmin | Company | ❌ | ✅ | ✅ | ✅ |
| Admin | Company | ❌ | ✅ | ✅ | ✅ |
| User | Company | ❌ | Request Only | ❌ | ❌ |
| SuperAdmin | Vendor | ❌ | ❌ | ❌ | ✅ |
| Admin | Vendor | ❌ | ❌ | ❌ | ✅ |
| User | Vendor | ❌ | ❌ | ❌ | ❌ |

## Database Schema

The application uses SQLite database with the following main entities:
- User
- Organization (Vendor/Company)
- Product
- Unit
- Order
- OrderItem
- OrderItemHistory
- Invoice
- Document
- OrderApproval

## Environment Variables

- `DATABASE_URL`: Database connection string (default: sqlite:///./marketplace.db)
- `SECRET_KEY`: JWT secret key (change in production)

## Development

The application will automatically create the database tables and default AppOwner user on first run.

For production deployment, make sure to:
1. Change the default SECRET_KEY
2. Update CORS settings
3. Use a production database (PostgreSQL recommended)
4. Implement proper file upload handling for documents
5. Add input validation and sanitization
6. Implement rate limiting
7. Add logging and monitoring
