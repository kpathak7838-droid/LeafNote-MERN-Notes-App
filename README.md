# LeafNote — Full-Stack MERN Notes Application

A modern, full-stack collaborative notes workspace built with **MongoDB, Express.js, React (Vite), and Node.js**. LeafNote implements secure JWT authentication, Bcrypt password hashing, and a **One-to-Many** user-to-note ownership model where users can browse shared workspace notes while strictly restricting edit and delete actions to the note's original creator.

---

## Key Features

- **User Authentication & Security:** Registration and login powered by **Bcrypt** one-way password hashing and stateless **JWT (JSON Web Tokens)**.
- **Creator Ownership & Access Control:**
  - Read-all collaborative workspace (`GET /note/all`) + personal notes view (`GET /note/read`).
  - Custom Express `auth` middleware injects verified `userID` from the token (`req.body.userID = decoded.userID`), ensuring only the note owner can update or delete their notes.
- **Studio Workspace UI:**
  - Dark & Light theme toggle, pinned notes, category filtering, real-time search, full-screen reader modal, and quick-start note templates.

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router, CSS3
- **Backend:** Node.js, Express.js, JSON Web Token (`jsonwebtoken`), Bcrypt (`bcrypt`)
- **Database:** MongoDB & Mongoose ODM

---

## Project Structure

```text
LeafNote-MERN-Notes-App/
├── backend/
│   ├── middleware/
│   │   └── auth.middleware.js   # JWT verification & userID injection
│   ├── model/
│   │   ├── user.model.js        # User schema
│   │   └── note.model.js        # Note schema (linked via userID)
│   ├── routes/
│   │   ├── user.routes.js       # /register, /login, /logout
│   │   └── note.routes.js       # /create, /all, /read, /update/:id, /delete/:id
│   ├── db.js                    # MongoDB connection
│   └── server.js                # Express app entry point (Port 8080)
├── frontend/
│   └── src/
│       ├── App.jsx              # Routing, Auth state & Studio UI
│       ├── App.css              # Responsive theme styling
│       └── main.jsx
└── .gitignore
