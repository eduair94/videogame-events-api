# Indie Festivals API

A TypeScript Express API that showcases indie game festival information from curated spreadsheets, synced to MongoDB.

## Features

- 🎮 **Festival Data**: Browse curated indie game festivals with filtering, sorting, and pagination
- 📊 **Steam Feature Tracking**: Track which festivals have been featured on Steam
- 🔄 **Data Sync**: Automatically sync data from CSV files to MongoDB
- 📈 **Statistics**: Get insights about festival types, open submissions, and more
- 🚀 **RESTful API**: Clean, well-documented REST endpoints

## Prerequisites

- Node.js 18+
- MongoDB (local or remote)
- npm or yarn

## Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   MONGODB_URI=mongodb://localhost:27017/indie-festivals
   PORT=3000
   NODE_ENV=development
   CSV_DATA_PATH=./downloads
   ```

3. **Ensure CSV files are in place:**
   The following files should be in the `downloads/` folder:
   - `Worthy festivals for Indie games - Curated.csv`
   - `Worthy festivals for Indie games - On the Fence.csv`
   - `Worthy festivals for Indie games - Steam feature tracker.csv`

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Sync Data Only
```bash
npm run sync
```

## API Endpoints

### Root
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation and available endpoints |
| GET | `/api/health` | Health check |

### Festivals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/festivals` | Get all festivals (with filtering) |
| GET | `/api/festivals/stats` | Get festival statistics |
| GET | `/api/festivals/types` | Get all festival types |
| GET | `/api/festivals/open` | Get festivals with open submissions |
| GET | `/api/festivals/upcoming` | Get festivals with upcoming deadlines |
| GET | `/api/festivals/:id` | Get a specific festival |

#### Query Parameters for `/api/festivals`
- `category`: Filter by category (`curated` or `on-the-fence`)
- `type`: Filter by festival type
- `submissionOpen`: Filter by submission status (`true` or `false`)
- `search`: Search in name, type, and comments
- `sortBy`: Field to sort by (default: `name`)
- `sortOrder`: Sort order (`asc` or `desc`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

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
| GET | `/api/sync/history` | Get sync history |
| GET | `/api/sync/last` | Get last sync info |

## Example Requests

### Get all curated festivals
```bash
curl http://localhost:3000/api/festivals?category=curated
```

### Get festivals with open submissions
```bash
curl http://localhost:3000/api/festivals/open
```

### Search for physical expos
```bash
curl "http://localhost:3000/api/festivals?type=Physical%20Expo"
```

### Get festival statistics
```bash
curl http://localhost:3000/api/festivals/stats
```

### Trigger data sync
```bash
curl -X POST http://localhost:3000/api/sync
```

## Project Structure

```
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── database/        # Database connection
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # CLI scripts
│   ├── services/        # Business logic
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── downloads/           # CSV data files
├── .env                 # Environment variables
├── .env.example         # Example environment file
├── package.json
├── tsconfig.json
└── README.md
```

## Data Models

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

## License

MIT
