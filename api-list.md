AUTH
POST   /auth/register
POST   /auth/login
POST   /auth/refresh-token
POST   /auth/logout
POST   /auth/logout-all
POST   /auth/change-password
POST   /auth/forgot-password => mvp 2
POST   /auth/reset-password => mpv 2

USER 
GET     /users                 (admin)
GET     /users/:id             (admin)
DELETE  /users/:id             (admin, soft delete)
GET     /users/profile 
PATCH   /users/me/photo
PATCH   /users/me
GET     /users/summary         (admin) => mvp 2

FINANCIAL-PROFILES
GET     /financial-profiles/me
PUT     /financial-profiles
GET     /financial-profiles/:userId   (admin)

CATEGORIES
POST    /categories
GET     /categories              ?type=INCOME|EXPENSE|INVESTMENT
GET     /categories/:id
PATCH   /categories/:id
DELETE  /categories/:id

TRANSACTIONS
POST    /transactions
GET     /transactions            ?type=INCOME|EXPENSE|INVESTMENT&categoryId=&startDate=&endDate=&page=&limit=
GET     /transactions/:id
PATCH   /transactions/:id
DELETE  /transactions/:id        (soft delete)

DEBTS
POST    /debts
GET     /debts
GET     /debts/:id
PATCH   /debts/:id
DELETE  /debts/:id
POST    /debts/:id/payments
GET     /debts/:id/payments

INVESTMENTS
POST    /investments
GET     /investments
GET     /investments/portfolio   (portfolio summary: totalInvested, currentValue, P&L)
GET     /investments/:id
PATCH   /investments/:id
DELETE  /investments/:id
POST    /investments/:id/transactions    (BUY/SELL)
GET     /investments/:id/transactions
POST    /investments/:id/prices          (update asset price)
GET     /investments/:id/prices

DASHBOARD
GET     /dashboard/overview      (current month summary + comparison + alerts)
GET     /dashboard/summary       ?year=&month=
GET     /dashboard/forecast      (progress forecast + milestones)
GET     /dashboard/what-if       ?additionalSaving=
GET     /dashboard/net-worth     (Total Assets - Total Liabilities + milestones)

SUBSCRIPTIONS
GET     /subscriptions/plans                        (public: daftar paket + harga)
POST    /subscriptions/webhook                      (public: Midtrans payment notification)
POST    /subscriptions                              (user: pilih plan → generate QRIS via Midtrans)
GET     /subscriptions/me                           (user: status subscription + sisa hari)
GET     /subscriptions/payments                     (user: riwayat pembayaran)
PATCH   /subscriptions/payments/:paymentId/cancel   (user: batalkan pembayaran PENDING)
PATCH   /subscriptions/payments/:paymentId/confirm  (admin: konfirmasi pembayaran)
GET     /subscriptions/admin/payments               (admin: semua pembayaran ?status=PENDING|PAID|...)
