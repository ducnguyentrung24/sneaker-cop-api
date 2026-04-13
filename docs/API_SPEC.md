# API SPEC

## System

### GET /

Response:
{
  "message": "Sneaker Cop API 🚀"
}

## Database

### Sequelize + User Model

Description:

- Using Sequelize ORM
- User model defined in module
- Database synced automatically

## Auth

### POST /api/auth/register

Request:
{
  "email": "string",
  "password": "string",
  "full_name": "string"
}

Response:
{
  "message": "Register success",
  "data": {
    "id": number,
    "email": "string",
    "full_name": "string"
  }
}

### POST /api/auth/login

Request:
{
  "email": "string",
  "password": "string"
}

Response:
{
  "message": "Login success",
  "data": {
    "user": {},
    "token": "jwt"
  }
} 

## Validation (Joi)

### Auth

- Email phải đúng format
- Password ≥ 6 ký tự
- Full name bắt buộc
- Tự động loại bỏ field không hợp lệ

## Auth Middleware

### Protected Routes

- Require JWT token in header:
  Authorization: Bearer `<token>`

### Role-based Access

- ADMIN routes require role = ADMIN
- CUSTOMER routes require login
