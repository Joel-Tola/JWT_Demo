# JWT Authentication Demo

A secure authentication API built with Node.js, Express, MongoDB, and JSON Web Tokens (JWT). This project demonstrates how to implement a robust authentication flow, complete with access tokens and refresh token rotation, following best practices.

## Features

- **User Registration & Login**: Secure user signup and signin with password hashing using `bcryptjs`.
- **JWT Access Tokens**: Short-lived access tokens returned securely to the client.
- **Refresh Token Rotation**: Secure, long-lived refresh tokens stored in an HTTP-only cookie to prevent XSS attacks.
- **Refresh Token Revocation**: Ability to log out users and revoke active refresh tokens in the database.
- **Protected Routes**: Middleware to guard API endpoints and authenticate users based on their access token.

## Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express**: Web framework for building the REST API.
- **MongoDB**: NoSQL database for storing user and refresh token data.
- **Mongoose**: ODM library for MongoDB.
- **jsonwebtoken (JWT)**: For securely transmitting information between parties as a JSON object.
- **bcryptjs**: For hashing user passwords.

## Getting Started

### Prerequisites

- Node.js installed on your machine.
- MongoDB instance (local or Atlas) running.

### Installation

1. Clone this repository (if applicable) or navigate to the project directory:
   ```bash
   cd JWT_Demo
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ```

4. Start the server:
   ```bash
   npm run dev
   ```
   *(Assuming you have a dev script like `nodemon server.js` set up, otherwise use `node server.js` or `npm start`)*

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Request Body | Headers/Cookies |
| --- | --- | --- | --- | --- |
| POST | `/register` | Register a new user | `{ "username", "email", "password" }` | None |
| POST | `/login` | Authenticate user & get tokens | `{ "email", "password" }` | Sets `refresh_token` cookie |
| POST | `/refresh` | Rotate refresh token & get new access token | None | Requires `refresh_token` cookie |
| POST | `/logout` | Invalidate refresh token & log out user | None | Requires `refresh_token` cookie |

### Profile Routes (`/api/profile`)

| Method | Endpoint | Description | Headers |
| --- | --- | --- | --- |
| GET | `/me` | Get current user's profile | `Authorization: Bearer <access_token>` |

## How It Works

1. **Login**: When a user logs in, the API generates a short-lived `accessToken` and a long-lived `refreshToken`. Next, the `refreshToken` is saved to the database (linked to the user) and sent to the client via a secure HTTP-only cookie.
2. **Accessing Protected Routes**: The client includes the `accessToken` in the `Authorization` header as a Bearer token when making requests to protected routes.
3. **Refreshing Tokens**: Under the hood, when the `accessToken` expires, the client calls the `/refresh` endpoint, which reads the `refresh_token` cookie. The server validates the token against the database, revokes the old token, issues a new `accessToken` and a new `refreshToken` (rotation), and saves the new refresh token to the database.
4. **Logout**: Calling `/logout` flags the user's active refresh token as revoked in the database and clears the HTTP-only cookie from the client.

## Acknowledgments

This project is based on the excellent tutorial from freeCodeCamp:
- [How to Build a Secure Authentication System with JWT and Refresh Tokens](https://www.freecodecamp.org/news/how-to-build-a-secure-authentication-system-with-jwt-and-refresh-tokens)

## License

This project is licensed under the ISC License.
