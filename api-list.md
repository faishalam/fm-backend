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
GET     /users/summary         (admin)
GET     /users/me
GET     /users/:id             (admin)
GET     /users/me
PATCH   /users/me/photo
PATCH   /users/:id             (admin)
DELETE  /users/:id             (admin)