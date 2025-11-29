# 🎮 Indie Game Festivals API

A comprehensive API that aggregates and serves information about indie game festivals worldwide. This project helps indie game developers discover festivals, expos, and events where they can showcase their games.

## 🌐 Live Demo

| | URL |
|---|---|
| **Frontend** | [https://videogame-festival-front.vercel.app/](https://videogame-festival-front.vercel.app/) |
| **Backend API** | [https://videogame-events-api.vercel.app/](https://videogame-events-api.vercel.app/) |
| **API Docs (Swagger)** | [https://videogame-events-api.vercel.app/docs](https://videogame-events-api.vercel.app/docs) |

## ✨ Features

- 🎮 **Festival Data**: Browse curated indie game festivals with filtering, sorting, and pagination
- 📊 **Steam Feature Tracking**: Track which festivals have been featured on Steam
- 🔄 **Data Sync**: Automatically sync data from CSV files to MongoDB
- 📈 **Statistics**: Get insights about festival types, open submissions, and more
- 🚀 **RESTful API**: Clean, well-documented REST endpoints

## 📦 Related Repositories

- **Frontend**: [github.com/eduair94/videogame-festival-front](https://github.com/eduair94/videogame-festival-front)

## 🎯 Purpose

Finding the right gaming festivals and events for indie developers can be overwhelming. This project solves that by:

1. **Aggregating Festival Data** - Curated list of worthy festivals for indie games from a community-maintained Google Spreadsheet
2. **Providing Useful Filters** - Filter by festival type (Physical Expo, Digital Expo, Online Festival, etc.), submission status, and more
3. **Tracking Steam Features** - Historical data on which festivals have been featured on Steam
4. **Auto-Syncing Data** - Daily automatic synchronization from Google Sheets to keep data fresh

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eduair94/videogame-events-api.git
   cd videogame-events-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   MONGODB_URI=mongodb://localhost:27017/indie-festivals
   PORT=3000
   NODE_ENV=development
   CSV_DATA_PATH=./downloads
   CRON_SECRET=your-secret-for-cron-jobs
   ```

4. **Ensure CSV files are in place:**
   
   The following files should be in the `downloads/` folder:
   - `Worthy festivals for Indie games - Curated.csv`
   - `Worthy festivals for Indie games - On the Fence.csv`
   - `Worthy festivals for Indie games - Steam feature tracker.csv`

5. **Run in development:**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/docs` | Swagger UI documentation |
| GET | `/openapi.json` | OpenAPI 3.0 specification |

### Festivals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/festivals` | Get all festivals (with filtering & pagination) |
| GET | `/api/festivals/stats` | Get festival statistics |
| GET | `/api/festivals/types` | Get all festival types |
| GET | `/api/festivals/open` | Get festivals with open submissions |
| GET | `/api/festivals/upcoming` | Get festivals with upcoming deadlines |
| GET | `/api/festivals/:id` | Get a specific festival by ID |

### Steam Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/steam-features` | Get all Steam feature records |
| GET | `/api/steam-features/stats` | Get Steam featuring statistics |
| GET | `/api/steam-features/featured` | Get featured festivals by year |
| GET | `/api/steam-features/:name` | Get Steam feature for a festival |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync` | Trigger data synchronization |
| POST | `/api/sync/google-sheets` | Sync from Google Sheets |
| GET | `/api/sync/history` | Get sync history |
| GET | `/api/sync/last` | Get last sync info |

## 🔍 Query Parameters

For `/api/festivals`:

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | `curated` or `on-the-fence` |
| `type` | string | Festival type (e.g., "Physical Expo") |
| `submissionOpen` | boolean | Filter by open submissions |
| `search` | string | Search in name, type, comments |
| `sortBy` | string | Field to sort by (default: `name`) |
| `sortOrder` | string | `asc` or `desc` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |

## 📁 Project Structure

```
├── api/
│   ├── index.ts         # Vercel serverless entry point
│   └── cron.ts          # Cron job handler for auto-sync
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas (Festival, SteamFeature)
│   ├── routes/          # API route definitions
│   ├── scripts/         # CLI scripts
│   ├── services/        # Business logic & sync services
│   ├── swagger.ts       # OpenAPI specification
│   └── app.ts           # Express app configuration
├── downloads/           # CSV data files
├── docs/                # Documentation
├── vercel.json          # Vercel deployment config
└── package.json
```

## 🔄 Data Source

Data is sourced from the community-maintained Google Spreadsheet:
**["Worthy festivals for Indie games"](https://docs.google.com/spreadsheets/d/1hdMFwVsOLPLrgNz8MCezIPDdsdKjUijs4rQ4pLdry4Q)**

The spreadsheet contains three sheets:
- **Curated** - Verified, high-quality festivals
- **On the Fence** - Festivals under consideration
- **Steam Feature Tracker** - Historical Steam featuring data

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Documentation**: Swagger/OpenAPI 3.0
- **Deployment**: Vercel (Serverless)
- **Data Sync**: Google Sheets CSV export + cron jobs

## 📜 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build TypeScript
npm start        # Start production server
npm run sync     # Manual data sync from CSV files
```

## 📊 Data Models

### Festival

- `name`: Festival name
- `type`: Type (Physical Expo, Digital Expo, etc.)
- `when`: When it occurs
- `deadline`: Submission deadline
- `submissionOpen`: Whether submissions are currently open
- `price`: Cost to participate
- `hasSteamPage`: Whether it has Steam page support
- `worthIt`: Community feedback on value
- `comments`: Additional notes
- `eventOfficialPage`: Official website
- `latestSteamPage`: Steam page URL
- `daysToSubmit`: Days until deadline
- `category`: curated or on-the-fence

### SteamFeature

- `festivalName`: Name of the festival
- `year2021`-`year2023`: Feature status (Y/N/etc.)
- `details2021`-`details2023`: Feature details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

---

Made with ❤️ for the indie game development community
