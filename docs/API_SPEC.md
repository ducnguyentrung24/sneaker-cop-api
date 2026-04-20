# API SPEC – SNEAKER COP

---

# I. SYSTEM

---

## 1. Health Check

### GET /

Description:
Kiểm tra server hoạt động

Response:
{
"message": "Sneaker Cop API 🚀"
}

---

# II. AUTH MODULE

---

## 1. Register

### POST /auth/register

Description:
Đăng ký tài khoản mới

Request:
{
"email": "string",
"password": "string (>=6)",
"full_name": "string"
}

Response:
{
"message": "Register success",
"data": {
"id": 1,
"email": "[test@gmail.com](mailto:test@gmail.com)",
"full_name": "Nguyen Duc"
}
}

Errors:

* Email already exists
* Email không hợp lệ
* Password phải ≥ 6 ký tự
* Missing required fields

---

## 2. Login

### POST /auth/login

Description:
Đăng nhập và trả về JWT token

Request:
{
"email": "string",
"password": "string"
}

Response:
{
"message": "Login success",
"data": {
"user": {
"id": 1,
"email": "[test@gmail.com](mailto:test@gmail.com)",
"full_name": "Nguyen Duc"
},
"token": "jwt_token"
}
}

Errors:

* Invalid credentials
* Email không hợp lệ

---

# III. USER MODULE

---

## 1. Get Profile

### GET /users/profile

Description:
Lấy thông tin user hiện tại

Headers:
Authorization: Bearer

Response:
{
"data": {
"id": 1,
"email": "[test@gmail.com](mailto:test@gmail.com)",
"full_name": "Nguyen Duc",
"phone": "0123456789",
"role": "CUSTOMER",
"isActive": true,
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
}

Errors:

* Unauthorized
* Invalid or expired token

---

## 2. Update Profile

### PUT /users/profile

Description:
Cập nhật thông tin user

Headers:
Authorization: Bearer

Request:
{
"full_name": "Nguyen Van A",
"phone": "0123456789"
}

Response:
{
"message": "Profile updated",
"data": {
"id": 1,
"email": "[test@gmail.com](mailto:test@gmail.com)",
"full_name": "Nguyen Van A",
"phone": "0123456789"
}
}

Errors:

* Unauthorized
* Full name là bắt buộc

---

## 3. Change Password

### PUT /users/change-password

Description:
Đổi mật khẩu

Headers:
Authorization: Bearer

Request:
{
"old_password": "123456",
"new_password": "abcdef"
}

Response:
{
"message": "Password changed successfully"
}

Errors:

* Old password is incorrect
* Password mới phải ≥ 6 ký tự
* Unauthorized

---

# IV. VALIDATION RULES

---

## 1. Auth Validation

* Email phải đúng format
* Password ≥ 6 ký tự
* Full name là bắt buộc

---

## 2. User Validation

* Full name là bắt buộc
* Password mới ≥ 6 ký tự

---

# V. AUTHENTICATION

---

## 1. JWT

* Sử dụng JSON Web Token
* Token được trả về khi login

---

## 2. Header Format

Authorization: Bearer

---

# VI. ROLES

---

## 1. USER ROLES

* ADMIN
* CUSTOMER

---

# VII. DATABASE (CURRENT)

---

## 1. Table: users

Fields:

* id (INTEGER, PK)
* email (STRING, UNIQUE)
* password (STRING)
* full_name (STRING)
* phone (STRING)
* role (ENUM: ADMIN, CUSTOMER)
* is_active (BOOLEAN)
* created_at (TIMESTAMP)
* updated_at (TIMESTAMP)

Description:
User table được quản lý bởi Sequelize (model-first)

---

# VIII. BRAND MODULE

---

## 1. Create Brand

### POST /api/brands

Description:
Tạo brand mới (ADMIN)

Headers:
Authorization: Bearer

Request:
{
"name": "Nike"
}

Response:
{
"message": "Brand created",
"data": {
"id": 1,
"name": "Nike",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
}

Errors:

* Unauthorized
* Forbidden
* Brand already exists
* Name là bắt buộc

---

## 2. Get Brands (Pagination)

### GET /api/brands?page=1&limit=10

Description:
Lấy danh sách brand có phân trang

Request:
Query params:

* page (number, default = 1)
* limit (number, default = 10)

Response:
{
"data": [
{
"id": 1,
"name": "Nike",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
],
"pagination": {
"total": 100,
"page": 1,
"limit": 10,
"totalPages": 10
}
}

---

## 3. Get Brand By Id

### GET /api/brands/:id

Description:
Lấy chi tiết brand theo id

Response:
{
"data": {
"id": 1,
"name": "Nike",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
}

Errors:

* Brand not found

---

## 4. Update Brand

### PUT /api/brands/:id

Description:
Cập nhật brand (ADMIN)

Headers:
Authorization: Bearer

Request:
{
"name": "Adidas"
}

Response:
{
"message": "Brand updated",
"data": {
"id": 1,
"name": "Adidas",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-02T00:00:00Z"
}
}

Errors:

* Unauthorized
* Forbidden
* Brand not found
* Brand name already exists

---

## 5. Delete Brand

### DELETE /api/brands/:id

Description:
Xóa brand (ADMIN)

Headers:
Authorization: Bearer

Response:
{
"message": "Brand deleted"
}

Errors:

* Unauthorized
* Forbidden
* Brand not found

---

# IX. CATEGORY MODULE

---

## 1. Create Category

### POST /api/categories

Description:
Tạo category mới (ADMIN)

Headers:
Authorization: Bearer

Request:
{
"name": "Running"
}

Response:
{
"message": "Category created",
"data": {
"id": 1,
"name": "Running",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
}

Errors:

* Unauthorized
* Forbidden
* Category already exists
* Name là bắt buộc

---

## 2. Get Categories (Pagination)

### GET /api/categories?page=1&limit=10

Description:
Lấy danh sách category có phân trang

Request:
Query params:

* page (number, default = 1)
* limit (number, default = 10)

Response:
{
"data": [
{
"id": 1,
"name": "Running",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
],
"pagination": {
"total": 100,
"page": 1,
"limit": 10,
"totalPages": 10
}
}

---

## 3. Get Category By Id

### GET /api/categories/:id

Description:
Lấy chi tiết category theo id

Response:
{
"data": {
"id": 1,
"name": "Running",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-01T00:00:00Z"
}
}

Errors:

* Category not found

---

## 4. Update Category

### PUT /api/categories/:id

Description:
Cập nhật category (ADMIN)

Headers:
Authorization: Bearer

Request:
{
"name": "Basketball"
}

Response:
{
"message": "Category updated",
"data": {
"id": 1,
"name": "Basketball",
"created_at": "2026-01-01T00:00:00Z",
"updated_at": "2026-01-02T00:00:00Z"
}
}

Errors:

* Unauthorized
* Forbidden
* Category not found
* Category name already exists

---

## 5. Delete Category

### DELETE /api/categories/:id

Description:
Xóa category (ADMIN)

Headers:
Authorization: Bearer

Response:
{
"message": "Category deleted"
}

Errors:

* Unauthorized
* Forbidden
* Category not found

---

# X. PRODUCT MODULE

---

## 1. Get Products (Pagination + Search)

### GET /api/products?page=1&limit=10&search=&brand_id=&category_id=

Description:
Lấy danh sách sản phẩm có phân trang, tìm kiếm và filter

Query params:

- page (number, default = 1)
- limit (number, default = 10)
- search (string)
- brand_id (number)
- category_id (number)

Response:
{
  "data": [
    {
      "id": 1,
      "name": "Nike Air Force 1",
      "base_price": "2000000",
      "discount_percent": 10,
      "thumbnail": "https://...",
      "sold": 5
    }
  ],
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "total_pages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}

---

## 2. Get Product Detail

### GET /api/products/:id

Description:
Lấy chi tiết sản phẩm kèm images và variants

Response:
{
  "id": 1,
  "name": "Nike Air Force 1",
  "brand_id": 1,
  "category_id": 1,
  "base_price": "2000000",
  "discount_percent": 10,
  "description": "Classic sneaker",
  "thumbnail": "https://...",
  "sold": 5,
  "images": [
    {
      "id": 1,
      "image_url": "img1.jpg"
    }
  ],
  "variants": [
    {
      "id": 1,
      "color": "white",
      "size": "40",
      "stock": 10,
      "price": "2000000",
      "image_url": "variant.jpg",
      "sold": 2
    }
  ]
}

Errors:

- Product not found

---

## 3. Create Product

### POST /api/products

Description:
Tạo sản phẩm mới (ADMIN)

Request:
{
  "name": "Nike Air Force 1",
  "brand_id": 1,
  "category_id": 1,
  "base_price": 2000000,
  "discount_percent": 10,
  "description": "Classic sneaker",
  "thumbnail": "https://...",

  "images": [
    "img1.jpg",
    "img2.jpg"
  ],

  "variants": [
    {
      "color": "white",
      "size": "40",
      "stock": 10,
      "price": 2000000,
      "image_url": "variant.jpg"
    }
  ]
}

Rules:

- Tối đa 4 images
- Tên sản phẩm không được trùng
- Variant không được trùng (color + size)

Response:
{
  "id": 1,
  "name": "Nike Air Force 1",
  "created_at": "...",
  "updated_at": "..."
}

Errors:

- Product name already exists
- Maximum 4 images allowed
- Duplicate variant

---

## 4. Update Product

### PUT /api/products/:id

Description:
Cập nhật sản phẩm (replace images + variants)

Request:
{
  "name": "Nike Air Force 1 Updated",
  "brand_id": 1,
  "category_id": 1,
  "base_price": 2100000,
  "discount_percent": 5,
  "description": "Updated",
  "thumbnail": "https://...",

  "images": [
    "img1.jpg",
    "img2.jpg"
  ],

  "variants": [
    {
      "color": "white",
      "size": "40",
      "stock": 8,
      "price": 2100000,
      "image_url": "variant.jpg"
    }
  ]
}

Response:
{
  "id": 1,
  "name": "Nike Air Force 1 Updated",
  "updated_at": "..."
}

Errors:

- Product not found
- Product name already exists
- Maximum 4 images allowed
- Duplicate variant

---

## 5. Delete Product

### DELETE /api/products/:id

Description:
Xóa sản phẩm

Response:
{
  "message": "Product deleted successfully"
}

Errors:

- Product not found

# XI. CART MODULE

---

## 1. Get Cart

### GET /api/cart

Description:
Lấy danh sách sản phẩm trong giỏ hàng (giá realtime + discount)

Headers:
Authorization: Bearer

Response:
{
  "items": [
    {
      "id": 1,
      "quantity": 2,
      "price": 1800000,
      "original_price": 2000000,
      "total": 3600000,
      "product": {
        "id": 1,
        "name": "Nike Air Force 1",
        "thumbnail": "https://...",
        "discount_percent": 10
      },
      "variant": {
        "id": 1,
        "color": "white",
        "size": "42",
        "image_url": "https://..."
      }
    }
  ],
  "total_price": 3600000
}

Rules:

- Giá được tính realtime từ variant.price
- Áp dụng discount từ product.discount_percent
- Không lưu price trong database

Errors:

- Unauthorized

---

## 2. Add To Cart

### POST /api/cart

Description:
Thêm sản phẩm vào giỏ hàng hoặc tăng số lượng nếu đã tồn tại

Headers:
Authorization: Bearer

Request:
{
  "variant_id": 1,
  "quantity": 2
}

Response:
{
  "message": "Added to cart successfully",
  "data": {
    "id": 1,
    "cart_id": 1,
    "product_variant_id": 1,
    "quantity": 2
  }
}

Rules:

- Nếu item đã tồn tại → cộng quantity
- Không tạo duplicate item
- Quantity không được vượt stock

Errors:

- Product variant not found
- Quantity exceeds available stock
- variant_id and quantity are required

## 3. Update Cart Item Quantity

### PUT /api/cart/:id

Description:
Cập nhật số lượng sản phẩm trong giỏ hàng

Headers:
Authorization: Bearer

Request:
{
  "quantity": 3
}

Response:
{
  "success": true,
  "message": "Cart item quantity updated successfully",
  "data": {
    "id": 1,
    "quantity": 3
  }
}

Rules:

- Quantity phải ≥ 1
- Không được vượt stock
- Chỉ được update item của chính user

Errors:

- Cart item not found
- Quantity must be at least 1
- Quantity exceeds available stock
- Unauthorized

---

## 4. Delete Cart Item

### DELETE /api/cart/:id

Description:
Xóa sản phẩm khỏi giỏ hàng

Headers:
Authorization: Bearer

Response:
{
  "success": true,
  "message": "Item removed from cart"
}

Rules:

- Chỉ được xóa item của chính user

Errors:

- Cart item not found
- Unauthorized

# XII. ADDRESS MODULE

---

## 1. Get Addresses

### GET /api/addresses

Description:
Lấy danh sách địa chỉ của user

Headers:
Authorization: Bearer

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "receiver_name": "Nguyen Van A",
      "phone": "0123456789",
      "city": "Hanoi",
      "ward": "Hoan Kiem",
      "detail_address": "123 Tran Hung Dao",
      "is_default": true
    }
  ]
}

Rules:

- Sắp xếp theo is_default DESC
- Mỗi user tối đa 3 địa chỉ

Errors:

- Unauthorized

---

## 2. Create Address

### POST /api/addresses

Description:
Tạo địa chỉ mới

Headers:
Authorization: Bearer

Request:
{
  "receiver_name": "Nguyen Van A",
  "phone": "0123456789",
  "city": "Hanoi",
  "ward": "Hoan Kiem",
  "detail_address": "123 Tran Hung Dao",
  "is_default": true
}

Response:
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "id": 1,
    "is_default": true
  }
}

Rules:

- Tối đa 3 địa chỉ
- Nếu is_default = true → tất cả address khác = false

Errors:

- Maximum 3 addresses allowed
- Validation error
- Unauthorized

---

## 3. Update Address

### PUT /api/addresses/:id

Description:
Cập nhật thông tin địa chỉ

Headers:
Authorization: Bearer

Request:
{
  "receiver_name": "Nguyen Van B",
  "phone": "0987654321",
  "city": "Hanoi",
  "ward": "Ba Dinh",
  "detail_address": "456 Kim Ma",
  "is_default": true
}

Response:
{
  "success": true,
  "message": "Address updated successfully"
}

Rules:

- Chỉ update address của chính user
- Nếu is_default = true → tất cả address khác = false

Errors:

- Address not found
- Unauthorized
- Validation error

---

## 4. Set Default Address

### PATCH /api/addresses/:id/default

Description:
Đặt địa chỉ làm mặc định

Headers:
Authorization: Bearer

Response:
{
  "success": true,
  "message": "Set default address successfully",
  "data": {
    "id": 2,
    "is_default": true
  }
}

Rules:

- Chỉ có 1 address default
- Khi set default → tất cả address khác = false

Errors:

- Address not found
- Unauthorized

---

## 5. Delete Address

### DELETE /api/addresses/:id

Description:
Xóa địa chỉ

Headers:
Authorization: Bearer

Response:
{
  "success": true,
  "message": "Address deleted successfully"
}

Rules:

- Nếu xóa address đang default → tự động set address khác làm default (nếu còn)
- Chỉ được xóa address của chính user

Errors:

- Address not found
- Unauthorized

# XIII. ORDER MODULE

---

## 1. Checkout

### POST /api/orders

Description:
Tạo đơn hàng từ giỏ hàng (checkout)

Headers:
Authorization: Bearer

Request:
{
  "address_id": 1,
  "payment_method": "COD",
  "note": "Giao sau 6h tối"
}

Response:
{
  "success": true,
  "message": "Checkout successful",
  "data": {
    "id": 1,
    "order_code": "ORD-1710000000000",
    "status": "PENDING"
  }
}

Rules:

- Bắt buộc có address_id
- payment_method: COD | VNPAY (optional, default = COD)
- note là optional
- Cart không được rỗng
- Trừ stock ngay khi checkout
- Clear cart sau khi tạo đơn

Errors:

- Cart is empty
- Address not found
- Invalid payment method
- Out of stock
- Unauthorized

---

## 2. Get My Orders

### GET /api/orders?page=1&limit=10&status=&sort=

Description:
Lấy danh sách đơn hàng của user (có phân trang + filter)

Headers:
Authorization: Bearer

Query params:

- page (number, default = 1)
- limit (number, default = 10)
- status (optional)
- sort (optional, format: field:asc|desc)

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_code": "ORD-123",
      "status": "SHIPPING",
      "created_at": "2024-06-12",
      "total_price": 4500000,
      "items": [
        {
          "product_name": "Nike Jordan 1 Low",
          "color": "Wolf Grey",
          "size": 42,
          "image": "https://...",
          "quantity": 1,
          "price": 4500000
        }
      ]
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}

Rules:

- Chỉ lấy order của chính user
- Có include items (variant + product)
- Không trả full detail (chỉ summary)
- Sort mặc định: created_at DESC

Errors:

- Unauthorized

---

## 3. Get Order Detail

### GET /api/orders/:id

Description:
Lấy chi tiết đơn hàng

Headers:
Authorization: Bearer

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "order_code": "ORD-123",
    "status": "PENDING",
    "created_at": "2024-06-12",
    "receiver_name": "Nguyen Van A",
    "phone": "0123456789",
    "full_address": "123 Tran Hung Dao, Hoan Kiem, Hanoi",
    "note": "Giao sau 6h tối",
    "payment_method": "COD",
    "payment_status": "UNPAID",
    "items": [
      {
        "product_name": "Nike Jordan 1 Low",
        "color": "Wolf Grey",
        "size": 42,
        "quantity": 1,
        "price": 4500000,
        "image": "https://..."
      }
    ],
    "total_price": 4500000,
    "shipping_fee": 0,
    "final_price": 4500000
  }
}

Rules:

- Chỉ xem order của chính user
- Include đầy đủ items + variant + product
- Trả snapshot address

Errors:

- Order not found
- Unauthorized

---

## 4. Cancel Order

### PATCH /api/orders/:id/cancel

Description:
Huỷ đơn hàng

Headers:
Authorization: Bearer

Response:
{
  "success": true,
  "message": "Order cancelled successfully"
}

Rules:

- Chỉ huỷ khi status = PENDING
- Hoàn lại stock
- Không được huỷ đơn đã xử lý

Errors:

- Order not found
- Only pending orders can be cancelled
- Unauthorized

---

# XIV. ORDER ENUMS

---

## 1. Order Status

PENDING
PROCESSING
SHIPPING
COMPLETED
CANCELLED

---

## 2. Payment Method

COD
VNPAY

---

## 3. Payment Status

UNPAID
PAID
FAILED


# XV. PAYMENT MODULE (VNPAY)

---

## 1. Create Payment URL

### GET /api/payment/vnpay/:orderId

Description:
Tạo URL thanh toán VNPAY cho đơn hàng

Headers:
Authorization: Bearer

Params:

* orderId (number)

Response:
{
"success": true,
"data": {
"payment_url": "[https://sandbox.vnpayment.vn/paymentv2/vpcpay.html](https://sandbox.vnpayment.vn/paymentv2/vpcpay.html)?...",
"txn_ref": "ORD-1710000000000_1710001234567"
}
}

Rules:

* Order phải tồn tại
* Order chưa PAID
* Mỗi lần gọi tạo txnRef mới (retry luôn tại đây)
* txnRef phải unique
* Không reuse txnRef cũ
* vnp_OrderType bắt buộc

Errors:

* Order not found
* Order already paid
* Unauthorized

---

## 2. VNPAY Return (Callback)

### GET /api/payment/vnpay-return

Description:
API callback từ VNPAY sau khi thanh toán

Query Params (VNPAY gửi):

* vnp_Amount
* vnp_TxnRef
* vnp_ResponseCode
* vnp_SecureHash
* vnp_TransactionStatus
* vnp_PayDate
  ...

Logic:

* Verify signature (bắt buộc)
* Parse txnRef → lấy order_code
* Find order theo order_code
* Idempotent:
  * nếu đã PAID → return luôn
* Nếu vnp_ResponseCode = "00":
  * payment_status = PAID
  * status = PROCESSING
* Nếu fail:
  * payment_status = FAILED
* Redirect frontend

Response:
Redirect → CLIENT_URL/payment-result?status=success|fail&orderCode=...

Errors:

* Invalid signature
* Order not found

---

# XVI. PAYMENT RULES

## 1. Transaction Rules

* Mỗi lần thanh toán = txnRef mới
* txnRef format:
  ORD-123_1710000000000
* Không reuse txnRef

---

## 2. Signature Rules

* Params phải sort trước khi ký
* Không encode khi ký
* Encode khi build URL
* Không double encode

---

## 3. Callback Rules

* Verify signature bắt buộc
* Không trust query nếu chưa verify
* Idempotent (callback có thể gọi nhiều lần)

---

## 4. Security Rules

* Check amount = order.final_price
* Không update nếu đã PAID
* Không thanh toán lại order đã PAID

---

# XVII. PAYMENT FLOW

1. User checkout → tạo order (PENDING, UNPAID)
2. User bấm thanh toán:
   → GET /api/payment/vnpay/:orderId
3. Backend:
   → tạo payment_url
   → tạo txnRef mới
4. Frontend redirect sang VNPAY
5. User thanh toán
6. VNPAY redirect về:
   → /api/payment/vnpay-return
7. Backend:
   * verify signature
   * update order
8. Redirect frontend:
   → payment-result page
