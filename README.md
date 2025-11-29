# 🎮 Indie Game Festivals API# Indie Festivals API



A comprehensive API that aggregates and serves information about indie game festivals worldwide. This project helps indie game developers discover festivals, expos, and events where they can showcase their games.A TypeScript Express API that showcases indie game festival information from curated spreadsheets, synced to MongoDB.



## 🌐 Live Demo## Features



| | URL |- 🎮 **Festival Data**: Browse curated indie game festivals with filtering, sorting, and pagination

|---|---|- 📊 **Steam Feature Tracking**: Track which festivals have been featured on Steam

| **Frontend** | [https://videogame-festival-front.vercel.app/](https://videogame-festival-front.vercel.app/) |- 🔄 **Data Sync**: Automatically sync data from CSV files to MongoDB

| **Backend API** | [https://videogame-events-api.vercel.app/](https://videogame-events-api.vercel.app/) |- 📈 **Statistics**: Get insights about festival types, open submissions, and more

| **API Docs (Swagger)** | [https://videogame-events-api.vercel.app/docs](https://videogame-events-api.vercel.app/docs) |- 🚀 **RESTful API**: Clean, well-documented REST endpoints



## 📦 Related Repositories## Prerequisites



- **Frontend**: [github.com/eduair94/videogame-festival-front](https://github.com/eduair94/videogame-festival-front)- Node.js 18+

- MongoDB (local or remote)

## 🎯 Purpose- npm or yarn



Finding the right gaming festivals and events for indie developers can be overwhelming. This project solves that by:## Installation



1. **Aggregating Festival Data** - Curated list of worthy festivals for indie games from a community-maintained Google Spreadsheet1. **Clone and install dependencies:**

2. **Providing Useful Filters** - Filter by festival type (Physical Expo, Digital Expo, Online Festival, etc.), submission status, and more   ```bash

3. **Tracking Steam Features** - Historical data on which festivals have been featured on Steam   npm install

4. **Auto-Syncing Data** - Daily automatic synchronization from Google Sheets to keep data fresh   ```



## ✨ Features2. **Configure environment variables:**

   ```bash

- 🎮 **Festival Database**: Browse 1000+ curated indie game festivals with rich metadata   cp .env.example .env

- 📊 **Steam Feature Tracking**: See which festivals have been featured on Steam (2021-2024)   ```

- 🔄 **Auto-Sync**: Daily cron job syncs data from Google Sheets   

- 🔍 **Advanced Filtering**: Filter by type, category, submission status, and search terms   Edit `.env` with your settings:

- 📈 **Statistics**: Get insights about festival types, open submissions, and trends   ```env

- 📖 **Swagger Docs**: Interactive API documentation at `/docs`   MONGODB_URI=mongodb://localhost:27017/indie-festivals

- ⚡ **Serverless**: Deployed on Vercel for fast, scalable access   PORT=3000

   NODE_ENV=development

## 🚀 Quick Start   CSV_DATA_PATH=./downloads

   ```

### Prerequisites

3. **Ensure CSV files are in place:**

- Node.js 18+   The following files should be in the `downloads/` folder:

- MongoDB (local or MongoDB Atlas)   - `Worthy festivals for Indie games - Curated.csv`

   - `Worthy festivals for Indie games - On the Fence.csv`

### Installation   - `Worthy festivals for Indie games - Steam feature tracker.csv`



```bash## Usage

# Clone the repository

git clone https://github.com/eduair94/videogame-events-api.git### Development

cd videogame-events-api```bash

npm run dev

# Install dependencies```

npm install

### Production

# Configure environment```bash

cp .env.example .envnpm run build

# Edit .env with your MongoDB URInpm start

```

# Run in development

npm run dev### Sync Data Only

``````bash

npm run sync

### Environment Variables```



```env## API Endpoints

MONGODB_URI=mongodb://localhost:27017/indie-festivals

PORT=3000### Root

NODE_ENV=development| Method | Endpoint | Description |

CRON_SECRET=your-secret-for-cron-jobs|--------|----------|-------------|

```| GET | `/` | API documentation and available endpoints |

| GET | `/api/health` | Health check |

## 📚 API Endpoints

### Festivals

### Documentation| Method | Endpoint | Description |

| Method | Endpoint | Description ||--------|----------|-------------|

|--------|----------|-------------|| GET | `/api/festivals` | Get all festivals (with filtering) |

| GET | `/docs` | Swagger UI documentation || GET | `/api/festivals/stats` | Get festival statistics |

| GET | `/openapi.json` | OpenAPI 3.0 specification || GET | `/api/festivals/types` | Get all festival types |

| GET | `/api/festivals/open` | Get festivals with open submissions |

### Festivals| GET | `/api/festivals/upcoming` | Get festivals with upcoming deadlines |

| Method | Endpoint | Description || GET | `/api/festivals/:id` | Get a specific festival |

|--------|----------|-------------|

| GET | `/api/festivals` | Get all festivals (with filtering & pagination) |#### Query Parameters for `/api/festivals`

| GET | `/api/festivals/stats` | Get festival statistics |- `category`: Filter by category (`curated` or `on-the-fence`)

| GET | `/api/festivals/types` | Get all festival types |- `type`: Filter by festival type

| GET | `/api/festivals/open` | Get festivals with open submissions |- `submissionOpen`: Filter by submission status (`true` or `false`)

| GET | `/api/festivals/upcoming` | Get festivals with upcoming deadlines |- `search`: Search in name, type, and comments

| GET | `/api/festivals/:id` | Get a specific festival by ID |- `sortBy`: Field to sort by (default: `name`)

- `sortOrder`: Sort order (`asc` or `desc`)

### Steam Features- `page`: Page number (default: 1)

| Method | Endpoint | Description |- `limit`: Items per page (default: 50)

|--------|----------|-------------|

| GET | `/api/steam-features` | Get all Steam feature records |### Steam Features

| GET | `/api/steam-features/stats` | Get Steam featuring statistics || Method | Endpoint | Description |

| GET | `/api/steam-features/featured` | Get featured festivals by year ||--------|----------|-------------|

| GET | `/api/steam-features` | Get all Steam feature records |

### Sync| GET | `/api/steam-features/stats` | Get Steam featuring statistics |

| Method | Endpoint | Description || GET | `/api/steam-features/featured` | Get featured festivals by year |

|--------|----------|-------------|| GET | `/api/steam-features/:name` | Get Steam feature for a festival |

| POST | `/api/sync` | Trigger manual data synchronization |

| POST | `/api/sync/google-sheets` | Sync from Google Sheets |### Sync

| GET | `/api/sync/history` | Get sync history || Method | Endpoint | Description |

|--------|----------|-------------|

## 🔍 Query Parameters| POST | `/api/sync` | Trigger data synchronization |

| GET | `/api/sync/history` | Get sync history |

For `/api/festivals`:| GET | `/api/sync/last` | Get last sync info |



| Parameter | Type | Description |## Example Requests

|-----------|------|-------------|

| `category` | string | `curated` or `on-the-fence` |### Get all curated festivals

| `type` | string | Festival type (e.g., "Physical Expo") |```bash

| `submissionOpen` | boolean | Filter by open submissions |curl http://localhost:3000/api/festivals?category=curated

| `search` | string | Search in name, type, comments |```

| `sortBy` | string | Field to sort by (default: `name`) |

| `sortOrder` | string | `asc` or `desc` |### Get festivals with open submissions

| `page` | number | Page number (default: 1) |```bash

| `limit` | number | Items per page (default: 50) |curl http://localhost:3000/api/festivals/open

```

## 📁 Project Structure

### Search for physical expos

``````bash

├── api/curl "http://localhost:3000/api/festivals?type=Physical%20Expo"

│   ├── index.ts         # Vercel serverless entry point```

│   └── cron.ts          # Cron job handler for auto-sync

├── src/### Get festival statistics

│   ├── controllers/     # Request handlers```bash

│   ├── models/          # Mongoose schemas (Festival, SteamFeature)curl http://localhost:3000/api/festivals/stats

│   ├── routes/          # API route definitions```

│   ├── services/        # Business logic & sync services

│   ├── swagger.ts       # OpenAPI specification### Trigger data sync

│   └── app.ts           # Express app configuration```bash

├── docs/                # Documentationcurl -X POST http://localhost:3000/api/sync

├── vercel.json          # Vercel deployment config```

└── package.json

```## Project Structure



## 🔄 Data Source```

├── src/

Data is sourced from the community-maintained Google Spreadsheet:│   ├── config/          # Configuration

**["Worthy festivals for Indie games"](https://docs.google.com/spreadsheets/d/1hdMFwVsOLPLrgNz8MCezIPDdsdKjUijs4rQ4pLdry4Q)**│   ├── controllers/     # Request handlers

│   ├── database/        # Database connection

The spreadsheet contains three sheets:│   ├── middleware/      # Express middleware

- **Curated** - Verified, high-quality festivals│   ├── models/          # Mongoose models

- **On the Fence** - Festivals under consideration│   ├── routes/          # API routes

- **Steam Feature Tracker** - Historical Steam featuring data│   ├── scripts/         # CLI scripts

│   ├── services/        # Business logic

## 🛠️ Tech Stack│   ├── app.ts           # Express app setup

│   └── index.ts         # Entry point

- **Runtime**: Node.js 18+├── downloads/           # CSV data files

- **Framework**: Express.js with TypeScript├── .env                 # Environment variables

- **Database**: MongoDB with Mongoose├── .env.example         # Example environment file

- **Documentation**: Swagger/OpenAPI 3.0├── package.json

- **Deployment**: Vercel (Serverless)├── tsconfig.json

- **Data Sync**: Google Sheets CSV export + cron jobs└── README.md

```

## 📜 Scripts

## Data Models

```bash

npm run dev      # Start development server### Festival

npm run build    # Build TypeScript- `name`: Festival name

npm start        # Start production server- `type`: Type (Physical Expo, Digital Expo, etc.)

npm run sync     # Manual data sync from CSV files- `when`: When it occurs

```- `deadline`: Submission deadline

- `submissionOpen`: Whether submissions are currently open

## 🤝 Contributing- `price`: Cost to participate

- `hasSteamPage`: Whether it has Steam page support

Contributions are welcome! Please feel free to submit a Pull Request.- `worthIt`: Community feedback on value

- `comments`: Additional notes

## 📄 License- `eventOfficialPage`: Official website

- `latestSteamPage`: Steam page URL

MIT- `daysToSubmit`: Days until deadline

- `category`: curated or on-the-fence

---

### SteamFeature

Made with ❤️ for the indie game development community- `festivalName`: Name of the festival

- `year2021`-`year2023`: Feature status (Y/N/etc.)
- `details2021`-`details2023`: Feature details

## License

MIT
