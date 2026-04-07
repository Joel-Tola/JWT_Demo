# Hostinger VPS MongoDB Setup (Secure SSH Tunnel / Option A)

This document explains how this project connects to a **MongoDB instance running on a Hostinger VPS** using the **secure SSH tunnel method (Option A)**.

> This is the recommended setup for local development because MongoDB is **not exposed publicly** to the internet.

---

# Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Why Option A is Recommended](#why-option-a-is-recommended)
- [VPS Prerequisites](#vps-prerequisites)
- [Install MongoDB on Hostinger VPS](#install-mongodb-on-hostinger-vps)
- [Configure MongoDB to Listen Only on Localhost](#configure-mongodb-to-listen-only-on-localhost)
- [Create MongoDB Users](#create-mongodb-users)
- [Enable Authentication](#enable-authentication)
- [VPS Verification Tests](#vps-verification-tests)
- [Windows PowerShell SSH Tunnel Commands](#windows-powershell-ssh-tunnel-commands)
- [Local Connection String](#local-connection-string)
- [Node.js Test Script](#nodejs-test-script)
- [Mongoose Test Script](#mongoose-test-script)
- [How to Use During Local Development](#how-to-use-during-local-development)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)
- [Notes / Personal Reminders](#notes--personal-reminders)

---

# Overview

This project uses:

- **Hostinger VPS** for hosting MongoDB
- **MongoDB Community Edition**
- **SSH tunnel** for secure local access
- **Windows PowerShell** for local SSH tunnel commands
- **MongoDB authentication enabled**
- **Application-specific database user** (recommended best practice)

---

# Architecture

MongoDB runs on the VPS like this:

```text
VPS:
127.0.0.1:27017
```

This means:

- MongoDB is only accessible **inside the VPS**
- MongoDB is **not publicly reachable**

Local development works by creating an SSH tunnel:

```text
Local PC (127.0.0.1:27017)
        │
        ▼
SSH Tunnel
        │
        ▼
VPS (127.0.0.1:27017)
```

So the local app connects to:

```text
127.0.0.1:27017
```

…but the actual database is running securely on the VPS.

---

# Why This Option is Recommended

## Advantages

- MongoDB is **not exposed to the public internet**
- Safer than opening port **27017**
- No firewall rule needed for MongoDB
- Easier to secure during development
- Professional dev workflow

## Important Rule

**Do NOT open MongoDB publicly** for this setup.

That means:

- No public `27017` firewall rule
- No `bindIp: 0.0.0.0`
- Keep MongoDB on `127.0.0.1`

---

# VPS Prerequisites

Recommended VPS setup:

- Hostinger VPS
- Ubuntu **22.04** or **24.04**
- SSH access
- Root or sudo privileges

---

# Install MongoDB on Hostinger VPS

## 1) SSH into the VPS

```bash
ssh root@YOUR_VPS_IP
```

If using a custom SSH port:

```bash
ssh -p YOUR_SSH_PORT root@YOUR_VPS_IP
```

---

## 2) Update packages

```bash
apt update && apt upgrade -y
apt install -y curl gnupg ca-certificates
```

---

## 3) Check Ubuntu version

```bash
cat /etc/os-release
```

Use:

- `jammy` for Ubuntu **22.04**
- `noble` for Ubuntu **24.04**

---

## 4) Add MongoDB GPG key

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
```

---

## 5) Add MongoDB repository

### Ubuntu 22.04 (Jammy)

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | \
tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

### Ubuntu 24.04 (Noble)

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

---

## 6) Install MongoDB

```bash
apt update
apt install -y mongodb-org
```

---

## 7) Start and enable MongoDB

```bash
systemctl start mongod
systemctl enable mongod
```

Check status:

```bash
systemctl status mongod
```

Quick check:

```bash
systemctl is-active mongod
```

Expected:

```text
active
```

---

# Configure MongoDB to Listen Only on Localhost

Open config:

```bash
nano /etc/mongod.conf
```

Make sure the `net` section looks like this:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

## Important

For this secure setup:

- ✅ `127.0.0.1` = correct
- ❌ `0.0.0.0` = wrong for this approach

Restart after changes:

```bash
systemctl restart mongod
```

Verify:

```bash
ss -tulnp | grep 27017
```

Expected output should show:

```text
127.0.0.1:27017
```

---

# Create MongoDB Users

Create users **before** enabling authentication.

Open Mongo shell:

```bash
mongosh
```

---

## 1) Create admin user

```javascript
use admin

db.createUser({
  user: "mongoAdmin",
  pwd: "CHANGE_THIS_TO_A_STRONG_ADMIN_PASSWORD",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})
```

---

## 2) Create application database user

```javascript
use myappdb

db.createUser({
  user: "myappuser",
  pwd: "CHANGE_THIS_TO_A_STRONG_APP_PASSWORD",
  roles: [
    { role: "readWrite", db: "myappdb" }
  ]
})
```

## Best Practice

Do **not** use the admin user in the application.

Use:

- `mongoAdmin` for admin tasks only
- `myappuser` for the app connection

Exit:

```javascript
exit
```

---

# Enable Authentication

Edit MongoDB config:

```bash
nano /etc/mongod.conf
```

Add:

```yaml
security:
  authorization: enabled
```

Example relevant config:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1

security:
  authorization: enabled
```

Restart MongoDB:

```bash
systemctl restart mongod
```

---

# VPS Verification Tests

## 1) Test service is running

```bash
systemctl status mongod
```

---

## 2) Test MongoDB is listening only locally

```bash
ss -tulnp | grep 27017
```

Expected:

```text
127.0.0.1:27017
```

---

## 3) Test admin login

```bash
mongosh "mongodb://mongoAdmin:YOUR_ADMIN_PASSWORD@127.0.0.1:27017/admin?authSource=admin"
```

Inside shell:

```javascript
db.runCommand({ ping: 1 })
```

Expected:

```javascript
{ ok: 1 }
```

---

## 4) Test app user login

```bash
mongosh "mongodb://myappuser:YOUR_APP_PASSWORD@127.0.0.1:27017/myappdb?authSource=myappdb"
```

Inside shell:

```javascript
db.runCommand({ ping: 1 })
```

Write test:

```javascript
db.healthchecks.insertOne({
  source: "vps-local-shell",
  status: "ok",
  createdAt: new Date()
})
```

Read test:

```javascript
db.healthchecks.find().pretty()
```

---

# Windows PowerShell SSH Tunnel Commands

This is the main local development workflow.

## Recommended PowerShell command

```powershell
ssh -N -L 27017:127.0.0.1:27017 root@YOUR_VPS_IP
```

If using a custom SSH port:

```powershell
ssh -p YOUR_SSH_PORT -N -L 27017:127.0.0.1:27017 root@YOUR_VPS_IP
```

### Example

```powershell
ssh -p 65002 -N -L 27017:127.0.0.1:27017 root@123.45.67.89
```

---

## Command breakdown

### `ssh`
Starts SSH.

### `-N`
Do not open a remote shell.  
Tunnel only.

### `-L`
Local port forwarding.

Syntax:

```text
-L LOCAL_PORT:REMOTE_HOST:REMOTE_PORT
```

In this setup:

```text
-L 27017:127.0.0.1:27017
```

Meaning:

- local PC opens port `27017`
- forwards through SSH
- VPS connects to its own `127.0.0.1:27017`

---

# How to test if the tunnel works

After starting the tunnel, on your local machine:

### Test with Mongo shell

```bash
mongosh mongodb://127.0.0.1:27017
```

or

```bash
mongosh mongodb://localhost:27017
```

### Test with a simple port check (Linux/macOS/Git Bash)

```bash
nc -vz 127.0.0.1 27017
```

### On Windows PowerShell

```powershell
Test-NetConnection 127.0.0.1 -Port 27017
```

---

# Local Connection String

While the SSH tunnel is active, the app should use:

```env
MONGODB_URI=mongodb://myappuser:YOUR_APP_PASSWORD@127.0.0.1:27017/myappdb?authSource=myappdb
```

## Important

This only works while the SSH tunnel is running.

If the tunnel closes, the app will fail to connect.

---

# Password Encoding Reminder

If the password contains characters like:

- `@`
- `/`
- `:`
- `?`
- `#`

You should URL-encode it.

Example:

Password:

```text
MyP@ss/2026!
```

Encoded:

```text
MyP%40ss%2F2026!
```

Then:

```env
MONGODB_URI=mongodb://myappuser:MyP%40ss%2F2026!@127.0.0.1:27017/myappdb?authSource=myappdb
```

---

# Node.js Test Script

Create a test file like `test-native.js`.

```javascript
require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    console.log("1. Connecting to MongoDB through SSH tunnel...");
    await client.connect();
    console.log("2. Connected successfully!");

    const db = client.db("myappdb");

    console.log("3. Running ping...");
    const pingResult = await db.command({ ping: 1 });
    console.log("Ping result:", pingResult);

    console.log("4. Inserting test document...");
    const insertResult = await db.collection("healthchecks").insertOne({
      source: "node-native-over-ssh-tunnel",
      status: "ok",
      createdAt: new Date()
    });
    console.log("Inserted ID:", insertResult.insertedId);

    console.log("5. Reading test document...");
    const doc = await db.collection("healthchecks").findOne({
      _id: insertResult.insertedId
    });
    console.log("Read document:", doc);

    console.log("6. Counting documents...");
    const count = await db.collection("healthchecks").countDocuments();
    console.log("healthchecks count:", count);

    console.log("7. All native driver tests passed.");
  } catch (err) {
    console.error("Native driver test failed:");
    console.error(err);
  } finally {
    await client.close();
    console.log("8. Connection closed.");
  }
}

main();
```

Run:

```powershell
node test-native.js
```

---

# Mongoose Test Script

Create `test-mongoose.js`.

```javascript
require("dotenv").config();
const mongoose = require("mongoose");

async function main() {
  try {
    console.log("1. Connecting with Mongoose through SSH tunnel...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("2. Mongoose connected!");

    const healthSchema = new mongoose.Schema({
      source: String,
      status: String,
      createdAt: Date
    });

    const Healthcheck = mongoose.model("Healthcheck", healthSchema);

    console.log("3. Creating document...");
    const created = await Healthcheck.create({
      source: "mongoose-over-ssh-tunnel",
      status: "ok",
      createdAt: new Date()
    });
    console.log("Created:", created);

    console.log("4. Finding document...");
    const found = await Healthcheck.findById(created._id);
    console.log("Found:", found);

    console.log("5. Counting documents...");
    const total = await Healthcheck.countDocuments();
    console.log("Total docs:", total);

    console.log("6. All Mongoose tests passed.");
  } catch (err) {
    console.error("Mongoose test failed:");
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("7. Mongoose disconnected.");
  }
}

main();
```

Run:

```powershell
node test-mongoose.js
```

---

# How to Use During Local Development

## Terminal 1 (PowerShell): Start SSH tunnel

```powershell
ssh -N -L 27017:127.0.0.1:27017 root@YOUR_VPS_IP
```

---

## Terminal 2 (PowerShell): Run app

```powershell
npm run dev
```

---

## `.env`

```env
MONGODB_URI=mongodb://myappuser:YOUR_APP_PASSWORD@127.0.0.1:27017/myappdb?authSource=myappdb
```

---

# Troubleshooting

## Problem: `ECONNREFUSED 127.0.0.1:27017`

### Causes

- SSH tunnel is not running
- MongoDB is not running on VPS
- Wrong local port

### Fix

Check tunnel is running in PowerShell.

On VPS:

```bash
systemctl status mongod
ss -tulnp | grep 27017
```

---

## Problem: Port already in use

If local port `27017` is already used (for example by local MongoDB), use `27018` instead.

### Tunnel

```powershell
ssh -N -L 27018:127.0.0.1:27017 root@YOUR_VPS_IP
```

### `.env`

```env
MONGODB_URI=mongodb://myappuser:YOUR_APP_PASSWORD@127.0.0.1:27018/myappdb?authSource=myappdb
```

---

## Problem: Authentication failed

Usually caused by:

- wrong username
- wrong password
- wrong `authSource`

### Correct app user format

```text
?authSource=myappdb
```

### Correct admin format

```text
?authSource=admin
```

---

## Problem: `localhost` does not work

Use:

```text
127.0.0.1
```

instead of:

```text
localhost
```

This avoids IPv4/IPv6 issues in some Node.js / Mongoose setups.

---

# Security Checklist

- [ ] MongoDB installed on VPS
- [ ] MongoDB running
- [ ] `bindIp: 127.0.0.1`
- [ ] `authorization: enabled`
- [ ] Admin user created
- [ ] App user created
- [ ] No public firewall rule for port `27017`
- [ ] No Hostinger firewall rule exposing MongoDB
- [ ] SSH tunnel works from local machine
- [ ] App connects using `127.0.0.1`
- [ ] App uses app-specific MongoDB user
- [ ] Password is URL-encoded if needed

---

# Notes / Personal Reminders

## Example local workflow

1. Open **PowerShell Terminal 1**
2. Start SSH tunnel:

```powershell
ssh -N -L 27017:127.0.0.1:27017 root@YOUR_VPS_IP
```

3. Open **PowerShell Terminal 2**
4. Start app:

```powershell
npm run dev
```

5. App connects using:

```env
MONGODB_URI=mongodb://myappuser:YOUR_APP_PASSWORD@127.0.0.1:27017/myappdb?authSource=myappdb
```

---

## My reminders

- Keep MongoDB private
- Do NOT expose port 27017
- Use app user, not admin user
- Use `127.0.0.1`, not `localhost`
- Keep SSH tunnel terminal open
- If local port 27017 is busy, use 27018 instead
- If password contains `@` or `/`, URL-encode it