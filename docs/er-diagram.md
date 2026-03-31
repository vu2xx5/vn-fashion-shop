# ER Diagram -- VN Fashion Shop

So do thuc the - quan he / Entity-Relationship Diagram

## Mermaid Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar hashed_password
        varchar full_name
        varchar phone
        varchar avatar_url
        varchar role "admin | staff | customer"
        varchar oauth_provider "google | facebook | null"
        varchar oauth_provider_id
        boolean is_active
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }

    addresses {
        uuid id PK
        uuid user_id FK
        varchar full_name
        varchar phone
        varchar street
        varchar ward
        varchar district
        varchar city
        varchar province
        varchar postal_code
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }

    categories {
        uuid id PK
        uuid parent_id FK "self-referencing"
        varchar name
        varchar slug UK
        text description
        varchar image_url
        integer sort_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    products {
        uuid id PK
        uuid category_id FK
        varchar name
        varchar slug UK
        text description
        text short_description
        decimal base_price
        decimal sale_price
        varchar currency "VND"
        varchar brand
        varchar material
        varchar care_instructions
        varchar origin "Viet Nam"
        boolean is_active
        boolean is_featured
        integer total_sold
        decimal average_rating
        integer review_count
        jsonb meta_data
        timestamp created_at
        timestamp updated_at
    }

    product_images {
        uuid id PK
        uuid product_id FK
        varchar url
        varchar alt_text
        integer sort_order
        boolean is_primary
        timestamp created_at
    }

    product_variants {
        uuid id PK
        uuid product_id FK
        varchar sku UK
        varchar size "XS | S | M | L | XL | XXL"
        varchar color
        varchar color_hex
        decimal price
        integer stock_quantity
        integer reserved_quantity
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    carts {
        uuid id PK
        uuid user_id FK "nullable for guest carts"
        varchar session_id "for guest carts"
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        integer quantity
        timestamp created_at
        timestamp updated_at
    }

    orders {
        uuid id PK
        uuid user_id FK
        varchar order_number UK
        varchar status "pending | confirmed | processing | shipped | delivered | cancelled | refunded"
        decimal subtotal
        decimal shipping_fee
        decimal discount_amount
        decimal total_amount
        varchar currency "VND"
        varchar payment_method "stripe | cod"
        varchar payment_status "pending | paid | failed | refunded"
        varchar stripe_payment_intent_id
        varchar shipping_name
        varchar shipping_phone
        varchar shipping_address
        varchar shipping_city
        varchar shipping_province
        varchar tracking_number
        text note
        timestamp paid_at
        timestamp shipped_at
        timestamp delivered_at
        timestamp cancelled_at
        timestamp created_at
        timestamp updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        varchar product_name
        varchar variant_sku
        varchar size
        varchar color
        decimal unit_price
        integer quantity
        decimal total_price
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK "nullable"
        varchar action "create | update | delete | login | logout | payment"
        varchar entity_type "user | product | order | cart"
        uuid entity_id
        jsonb old_values
        jsonb new_values
        varchar ip_address
        varchar user_agent
        timestamp created_at
    }

    %% Relationships
    users ||--o{ addresses : "has many"
    users ||--o{ carts : "has"
    users ||--o{ orders : "places"
    users ||--o{ audit_logs : "generates"

    categories ||--o{ categories : "has subcategories"
    categories ||--o{ products : "contains"

    products ||--o{ product_images : "has"
    products ||--o{ product_variants : "has"

    carts ||--o{ cart_items : "contains"
    product_variants ||--o{ cart_items : "referenced in"

    orders ||--o{ order_items : "contains"
    product_variants ||--o{ order_items : "referenced in"
```

## Mo ta bang / Table Descriptions

### users
Luu tru thong tin nguoi dung, bao gom xac thuc va OAuth.
Stores user information including authentication and OAuth data.

### addresses
Dia chi giao hang cua nguoi dung. Moi nguoi dung co the co nhieu dia chi.
Shipping addresses for users. Each user can have multiple addresses.

### categories
Danh muc san pham, ho tro danh muc con (self-referencing).
Product categories, supports subcategories via self-referencing.

### products
Thong tin san pham thoi trang bao gom gia, mo ta, va thong tin xuat xu.
Fashion product information including price, description, and origin.

### product_images
Hinh anh san pham, ho tro nhieu hinh moi san pham.
Product images, supports multiple images per product.

### product_variants
Bien the san pham theo kich co va mau sac, quan ly ton kho theo tung bien the.
Product variants by size and color, inventory managed per variant.

### carts
Gio hang, ho tro ca khach dang nhap va khach vang lai (session-based).
Shopping carts, supports both logged-in users and guest carts (session-based).

### cart_items
Cac mat hang trong gio hang, lien ket toi bien the san pham cu the.
Cart line items, linked to specific product variants.

### orders
Don hang bao gom trang thai, thanh toan, va thong tin giao hang.
Orders including status, payment, and shipping information.

### order_items
Chi tiet don hang. Luu tru gia va thong tin san pham tai thoi diem dat hang (snapshot).
Order line items. Stores price and product info at time of purchase (snapshot).

### audit_logs
Nhat ky hoat dong he thong phuc vu kiem soat va bao mat.
System activity logs for auditing and security purposes.
