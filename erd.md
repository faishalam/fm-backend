Table users {
  id uuid [pk]
  email varchar [unique, not null]
  password varchar [not null]
  username varchar [not null]
  phone_number varchar 
  avatar varchar 
  role varchar
  
  is_active boolean [default: true, not null]
  deleted_at timestamp

  created_at timestamp
  updated_at timestamp
}

Table financial_profiles {
  id uuid [pk]
  user_id uuid [unique, not null]

  salary_monthly decimal
  current_savings decimal [default: 0, not null]
  target_amount decimal [not null, default: 1000000000]

  created_at timestamp
  updated_at timestamp
}

Table categories {
  id uuid [pk]
  user_id uuid [not null]
  name varchar [not null]
  type transaction_type [not null]

  is_system boolean [default: false]

  created_at timestamp
  updated_at timestamp
}

Table transactions {
  id uuid [pk]
  user_id uuid [not null]
  category_id uuid [not null]

  amount decimal [not null]
  note varchar
  transaction_date date [not null]

  deleted_at timestamp

  created_at timestamp
  updated_at timestamp

  indexes {
    (user_id)
    (transaction_date)
  }
}

Table refresh_tokens {
  id uuid [pk]
  user_id uuid [not null]

  token_hash varchar [not null]

  device_id varchar
  device_name varchar

  expires_at timestamp [not null]
  revoked boolean [default: false]

  created_at timestamp

  indexes {
    (user_id)
  }
}

Table subscriptions {
  id uuid [pk]
  user_id uuid [unique, not null]

  plan subscription_plan [not null]
  status subscription_status [not null]

  start_date timestamp
  end_date timestamp

  created_at timestamp
  updated_at timestamp
}

Table payments {
  id uuid [pk]
  user_id uuid [not null]
  subscription_id uuid

  external_id varchar [unique]

  amount decimal [not null]
  currency varchar [default: "IDR"]

  provider varchar
  payment_method payment_method [not null]

  status payment_status [not null]

  qr_url varchar
  expired_at timestamp

  paid_at timestamp

  created_at timestamp
  updated_at timestamp

  indexes {
    (user_id)
    (status)
  }
}

Enum transaction_type {
  INCOME
  EXPENSE
}

Enum subscription_plan {
  FREE
  PRO
}

Enum subscription_status {
  ACTIVE
  EXPIRED
  CANCELLED
}

Enum payment_method {
  QRIS
}

Enum payment_status {
  PENDING
  PAID
  FAILED
  EXPIRED
  CANCELLED
}

Ref: financial_profiles.user_id > users.id
Ref: categories.user_id > users.id
Ref: transactions.user_id > users.id
Ref: transactions.category_id > categories.id
Ref: refresh_tokens.user_id > users.id
Ref: subscriptions.user_id > users.id
Ref: payments.user_id > users.id
Ref: payments.subscription_id > subscriptions.id