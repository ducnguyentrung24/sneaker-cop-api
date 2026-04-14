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

## 1. Create Brand

POST /api/brands

## 2. Get Brands (Pagination)

GET /api/brands?page=1&limit=10

## 3. Get Brand By Id

GET /api/brands/:id

## 4. Update Brand

PUT /api/brands/:id

## 5. Delete Brand

DELETE /api/brands/:id
