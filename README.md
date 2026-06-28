# 🏔️ PeakAndPack: AI QA Practice App

A sample trekking, camping, and travel gear e-commerce app with **intentional bugs** built in. This README covers getting the API running. The Claude-powered AI QA Agent gets built later in the series, as part of learning Approach D (AI QA Agent), it isn't included from the start on purpose.

---

## 🗂️ What's in This Folder

```
PeakAndPackShopDemo/
├── backend/          ← The e-commerce API (Node.js)
│   ├── server.js     ← Main API with 11 built-in bugs
│   ├── package.json  ← Dependencies
│   └── render.yaml   ← Render.com deploy config
└── README.md         ← This file
```

A `qa-agent/` folder gets added later, once we build the AI QA Agent together.

---

## 🚀 Step 1 — Deploy the API (Free, ~5 minutes)

You'll host the backend API on **Render.com** for free. No credit card needed.

### Instructions:

1. **Create a GitHub account** (free) at https://github.com if you don't have one

2. **Create a new repository** on GitHub:
   - Click the green **New** button
   - Name it: `PeakAndPackShopDemo`
   - Set to **Public**
   - Click **Create repository**

3. **Upload the backend files**:
   - In your new repo, click **Add file → Upload files**
   - Upload everything from the `backend/` folder:
     - `server.js`
     - `package.json`
     - `render.yaml`
   - Click **Commit changes**

4. **Deploy on Render.com**:
   - Go to https://render.com and click **Get Started Free**
   - Sign up with your GitHub account
   - Click **New → Web Service**
   - Connect your `PeakAndPackShopDemo` repository
   - Render will auto-detect the settings from `render.yaml`
   - Click **Create Web Service**
   - Wait ~3 minutes for deployment

5. **Copy your API URL**:
   - After deployment, Render shows a URL like: `https://peakandpack-api-xxxx.onrender.com`
   - Save this URL, you'll need it for manual testing now and for the AI QA Agent later

✅ Test it works: visit `https://your-url.onrender.com/health`, you should see:
```json
{"status": "ok", "timestamp": "...", "version": "1.0.0"}
```

---

## 🐛 Built-in Bugs (Don't peek until after your manual exploration!)

<details>
<summary>Reveal bugs (spoilers!)</summary>

| # | Location | Bug Description | Severity |
|---|----------|----------------|----------|
| 1 | Products | Sleeping Bag (-15C) has **negative price** (-$89.00) | P1 High |
| 2 | Products | One product has **empty name** | P1 High |
| 3 | Products | Insulated Water Bottle priced at **$9,999.99** (data error) | P2 Medium |
| 4 | Products | No validation, negative prices are returned to UI | P1 High |
| 5 | Products | **No default sort**, results are non-deterministic | P3 Low |
| 6 | Auth | Register accepts **empty name** with no error | P2 Medium |
| 7 | Cart | Total calculated from **client-side prices** (not verified) | P1 High |
| 8 | Checkout | **No stock check**, can order out-of-stock items | P2 Medium |
| 9 | Checkout | Discount code `SAVE10` = **100% off** (should be 10%) | P0 Critical |
| 10 | Orders | `GET /api/orders` returns **all users' orders** (data leak!) | P0 Critical |
| 11 | Search | `GET /api/search` without `?q` param **crashes server** | P1 High |

</details>

---

## 📡 API Endpoints Reference

| Method | Endpoint | Auth? | Description |
|--------|----------|-------|-------------|
| GET | /health | No | Health check |
| GET | /api/products | No | List all products |
| GET | /api/products/:id | No | Get product by ID |
| GET | /api/categories | No | List categories |
| GET | /api/search?q=term | No | Search products |
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login, get JWT |
| GET | /api/cart | Yes | View cart |
| POST | /api/cart | Yes | Add to cart |
| DELETE | /api/cart/:id | Yes | Remove from cart |
| POST | /api/orders/checkout | Yes | Place order |
| GET | /api/orders | Yes | Order history |

**Test credentials:**
- Email: `test@peakandpack.com`
- Password: `password123`

---

## 🧪 What Gets Tested Later (When We Build the AI QA Agent)

| Suite | What it will do |
|-------|-------------|
| 🖼️ Visual Regression | Fetches product data and asks Claude to identify UI display bugs |
| 🔌 API Contract Testing | Calls each endpoint, checks status codes, validates response schema |
| 🔄 Functional E2E Flows | Traces the full user journey: browse → login → cart → checkout |
| 🐛 Bug Detection | Uses Claude to write a full bug report with severity ratings |
| 📋 Test Case Creation | Claude generates a full test case suite with steps and expected results |
| 🎯 Test Strategy | Claude creates a tailored QA strategy document for this app |

This is what Approach D (AI QA Agent) covers later in the series, once we've built it together.

---

## 💡 Tips for Right Now

1. **Explore manually first**, poke at the live API with a browser or Postman
2. **Don't peek at the bug list above** until you've tried to find a few yourself
3. **Keep notes**, what you find by hand now becomes useful comparison material once we build the agent later

---

## 🆓 Cost Estimate

- **Render.com**: Free tier (app sleeps after 15 min inactivity, first request takes ~30s to wake)
- **GitHub**: Free
- **Anthropic API**: Not needed yet, only once we build the AI QA Agent later in the series

---

*Built for QA training purposes. All bugs are intentional.*
