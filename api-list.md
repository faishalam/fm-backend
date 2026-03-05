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
DELETE  /users/:id             (admin)
GET     /users/profile 
PATCH   /users/me/photo
PATCH   /users/:id             
GET     /users/summary         (admin) => mvp 2