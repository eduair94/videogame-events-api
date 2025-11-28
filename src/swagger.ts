/**
 * OpenAPI 3.0 Specification for Indie Festivals API
 * 
 * This specification is designed to be both human and AI-readable.
 * It provides comprehensive documentation for all API endpoints,
 * including request/response schemas, examples, and semantic descriptions.
 * 
 * @ai-context This API manages indie game festival data including:
 * - Festival information (dates, submission deadlines, official pages)
 * - Steam featuring/sale events
 * - Data enrichment with images, social links, and verified information
 * - Synchronization from external data sources (CSV files)
 */

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Indie Game Festivals API',
    version: '1.0.0',
    description: `
# Indie Game Festivals API

A comprehensive REST API for discovering and managing indie game festival information.

## Overview

This API provides access to a curated database of indie game festivals, showcases, and Steam featuring events. 
It aggregates data from various sources and enriches it with additional metadata like images, social media links, and verification status.

## Key Features

- **Festival Discovery**: Browse and search indie game festivals worldwide
- **Submission Tracking**: Find festivals with open submissions and upcoming deadlines
- **Steam Features**: Track Steam sales and featuring opportunities
- **Data Enrichment**: Automatic scraping of festival websites for images and social links
- **Real-time Sync**: Keep data up-to-date with source spreadsheets

## Authentication

Currently, this API is open and does not require authentication.

## Rate Limiting

Please be respectful with API usage. The enrichment endpoints have built-in delays to avoid overwhelming target websites.

## Data Sources

Data is sourced from community-maintained spreadsheets tracking indie game festivals and opportunities.
    `,
    contact: {
      name: 'API Support',
      url: 'https://github.com/eduair94/videogame-events-api'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/',
      description: 'Current server'
    }
  ],
  tags: [
    {
      name: 'Festivals',
      description: `
Operations for indie game festivals.

**AI Context**: Festivals represent events where indie developers can showcase their games.
Each festival has submission periods, event dates, and may offer Steam featuring opportunities.
Key fields include: name, type, submissionDates, eventDates, eventOfficialPage, and enrichment data.
      `
    },
    {
      name: 'Steam Features',
      description: `
Operations for Steam featuring/sale events.

**AI Context**: Steam features are promotional events on the Steam platform.
They include sales, festivals, and showcases where games can be featured.
Key fields include: eventName, featuring status, registration details, and relevant dates.
      `
    },
    {
      name: 'Sync',
      description: `
Data synchronization operations.

**AI Context**: Sync operations import data from CSV files into the database.
This includes festivals, "on the fence" items, and Steam feature tracking data.
Sync can be triggered manually or runs automatically on server startup.
      `
    },
    {
      name: 'Enrichment',
      description: `
Data enrichment operations.

**AI Context**: Enrichment automatically scrapes festival official pages to extract:
- Images (Open Graph, Twitter cards, logos)
- Descriptions (meta tags)
- Social links (Twitter, Discord)
- Location and organizer information
Enrichment helps fill gaps in the original data and verify information.
      `
    },
    {
      name: 'Health',
      description: 'API health and status checks'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the current health status of the API including uptime.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                },
                example: {
                  status: 'ok',
                  timestamp: '2025-11-28T12:00:00.000Z',
                  uptime: 3600.5
                }
              }
            }
          }
        }
      }
    },
    '/api/festivals': {
      get: {
        tags: ['Festivals'],
        summary: 'List all festivals',
        description: `
Retrieves a paginated list of all festivals in the database.

**AI Usage Tips**:
- Use \`limit\` and \`skip\` for pagination
- Filter by \`type\` to get specific festival categories
- Use \`search\` for text-based filtering on festival names
- Results are sorted by name by default
        `,
        operationId: 'listFestivals',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of festivals to return (default: 50, max: 200)',
            schema: { type: 'integer', default: 50, maximum: 200 }
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Number of festivals to skip for pagination',
            schema: { type: 'integer', default: 0 }
          },
          {
            name: 'type',
            in: 'query',
            description: 'Filter by festival type (e.g., "Festival", "Award", "Steam Sale")',
            schema: { type: 'string' }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search term to filter festivals by name (case-insensitive)',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'List of festivals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', description: 'Number of festivals in this response' },
                    total: { type: 'integer', description: 'Total number of festivals matching query' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Festival' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/festivals/stats': {
      get: {
        tags: ['Festivals'],
        summary: 'Get festival statistics',
        description: `
Returns aggregate statistics about all festivals in the database.

**AI Context**: Useful for getting an overview of the data without fetching all records.
Returns counts by type, source, and submission status.
        `,
        operationId: 'getFestivalStats',
        responses: {
          '200': {
            description: 'Festival statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FestivalStats' },
                example: {
                  success: true,
                  data: {
                    total: 211,
                    byType: {
                      'Festival': 85,
                      'Award': 32,
                      'Steam Sale': 45
                    },
                    bySource: {
                      'curated': 210,
                      'on-the-fence': 1
                    },
                    withOpenSubmissions: 15
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/festivals/types': {
      get: {
        tags: ['Festivals'],
        summary: 'Get all festival types',
        description: 'Returns a list of all unique festival types/categories.',
        operationId: 'getFestivalTypes',
        responses: {
          '200': {
            description: 'List of festival types',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Festival', 'Award', 'Steam Sale', 'Showcase', 'Expo']
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/festivals/open': {
      get: {
        tags: ['Festivals'],
        summary: 'Get festivals with open submissions',
        description: `
Returns festivals that currently have open submission periods.

**AI Context**: This endpoint filters festivals where:
- Current date is after submission start date
- Current date is before submission end date
Useful for developers looking for festivals to submit their games to.
        `,
        operationId: 'getOpenFestivals',
        responses: {
          '200': {
            description: 'Festivals with open submissions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Festival' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/festivals/upcoming': {
      get: {
        tags: ['Festivals'],
        summary: 'Get upcoming festivals',
        description: `
Returns festivals with upcoming event dates.

**AI Context**: Filters festivals where event start date is in the future.
Sorted by event start date (soonest first).
Useful for planning and scheduling.
        `,
        operationId: 'getUpcomingFestivals',
        parameters: [
          {
            name: 'days',
            in: 'query',
            description: 'Number of days to look ahead (default: 90)',
            schema: { type: 'integer', default: 90 }
          }
        ],
        responses: {
          '200': {
            description: 'Upcoming festivals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Festival' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/festivals/{id}': {
      get: {
        tags: ['Festivals'],
        summary: 'Get festival by ID',
        description: 'Retrieves a single festival by its MongoDB ObjectId.',
        operationId: 'getFestivalById',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'MongoDB ObjectId of the festival',
            schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }
          }
        ],
        responses: {
          '200': {
            description: 'Festival details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Festival' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Festival not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/steam-features': {
      get: {
        tags: ['Steam Features'],
        summary: 'List all Steam features',
        description: `
Retrieves all Steam featuring/sale events.

**AI Context**: Steam features represent promotional opportunities on Steam.
Each record tracks whether a game has been featured, registration dates, and event details.
        `,
        operationId: 'listSteamFeatures',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 }
          },
          {
            name: 'skip',
            in: 'query',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'List of Steam features',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SteamFeature' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/steam-features/stats': {
      get: {
        tags: ['Steam Features'],
        summary: 'Get Steam feature statistics',
        operationId: 'getSteamFeatureStats',
        responses: {
          '200': {
            description: 'Steam feature statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        featured: { type: 'integer' },
                        registered: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/steam-features/featured': {
      get: {
        tags: ['Steam Features'],
        summary: 'Get featured Steam events',
        description: 'Returns Steam events where the game has been featured.',
        operationId: 'getFeaturedSteamEvents',
        responses: {
          '200': {
            description: 'Featured Steam events',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SteamFeature' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/sync': {
      post: {
        tags: ['Sync'],
        summary: 'Trigger data synchronization',
        description: `
Triggers a full data synchronization from CSV source files.

**AI Context**: This endpoint:
1. Reads CSV files from the configured data path
2. Parses festival and Steam feature data
3. Upserts records into MongoDB (updates existing, creates new)
4. Logs the sync operation with statistics

Note: In production (Vercel), CSV files are not available. 
Run sync locally before deploying to populate the database.
        `,
        operationId: 'triggerSync',
        responses: {
          '200': {
            description: 'Sync completed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SyncResult' }
              }
            }
          },
          '500': {
            description: 'Sync failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/sync/history': {
      get: {
        tags: ['Sync'],
        summary: 'Get sync history',
        description: 'Returns a history of all synchronization operations.',
        operationId: 'getSyncHistory',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          }
        ],
        responses: {
          '200': {
            description: 'Sync history',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SyncLog' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/sync/last': {
      get: {
        tags: ['Sync'],
        summary: 'Get last sync information',
        operationId: 'getLastSync',
        responses: {
          '200': {
            description: 'Last sync details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/SyncLog' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/enrich': {
      post: {
        tags: ['Enrichment'],
        summary: 'Enrich festival data',
        description: `
Triggers enrichment of festival data by scraping official festival pages.

**AI Context**: This endpoint:
1. Finds festivals that haven't been enriched yet (or all if force=true)
2. Fetches each festival's official page
3. Extracts: images, descriptions, Twitter, Discord, location, organizer
4. Updates the festival record with enrichment data
5. Sets verification status (verified/failed)

Use query parameters to control batch size and rate limiting.
        `,
        operationId: 'triggerEnrichment',
        parameters: [
          {
            name: 'force',
            in: 'query',
            description: 'Re-enrich already processed festivals',
            schema: { type: 'boolean', default: false }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of festivals to process (default: 10 for API calls)',
            schema: { type: 'integer', default: 10 }
          },
          {
            name: 'delay',
            in: 'query',
            description: 'Delay between requests in milliseconds',
            schema: { type: 'integer', default: 1000 }
          }
        ],
        responses: {
          '200': {
            description: 'Enrichment completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EnrichmentResult' }
              }
            }
          }
        }
      }
    },
    '/api/enrich/stats': {
      get: {
        tags: ['Enrichment'],
        summary: 'Get enrichment statistics',
        description: 'Returns statistics about the enrichment status of festivals.',
        operationId: 'getEnrichmentStats',
        responses: {
          '200': {
            description: 'Enrichment statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer', description: 'Total festivals' },
                        verified: { type: 'integer', description: 'Successfully enriched' },
                        pending: { type: 'integer', description: 'Not yet processed' },
                        failed: { type: 'integer', description: 'Failed to enrich' },
                        withImages: { type: 'integer', description: 'Have images' },
                        withDescriptions: { type: 'integer', description: 'Have descriptions' },
                        withSocialLinks: { type: 'integer', description: 'Have Twitter or Discord' }
                      }
                    }
                  }
                },
                example: {
                  success: true,
                  data: {
                    total: 211,
                    verified: 150,
                    pending: 50,
                    failed: 11,
                    withImages: 85,
                    withDescriptions: 140,
                    withSocialLinks: 65
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/enrich/steam': {
      post: {
        tags: ['Enrichment'],
        summary: 'Enrich from Steam pages',
        description: `
Enriches festival data from their Steam sale/event pages.

**AI Context**: Some festivals have associated Steam pages that contain
higher-quality promotional images. This endpoint fetches those pages
and extracts capsule images to supplement the enrichment data.
        `,
        operationId: 'enrichFromSteam',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 }
          },
          {
            name: 'delay',
            in: 'query',
            schema: { type: 'integer', default: 1500 }
          }
        ],
        responses: {
          '200': {
            description: 'Steam enrichment completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/EnrichmentResult' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Festival: {
        type: 'object',
        description: `
Represents an indie game festival, showcase, or award event.

**AI Context - Key Fields**:
- \`name\`: Official festival name
- \`type\`: Category (Festival, Award, Steam Sale, etc.)
- \`submissionDates\`: When developers can submit games
- \`eventDates\`: When the festival takes place
- \`eventOfficialPage\`: URL to the festival website
- \`latestSteamPage\`: URL to Steam sale page (if applicable)
- \`enrichment\`: Auto-scraped data (images, social links, etc.)
        `,
        properties: {
          _id: {
            type: 'string',
            description: 'MongoDB ObjectId',
            example: '507f1f77bcf86cd799439011'
          },
          name: {
            type: 'string',
            description: 'Festival name',
            example: 'INDIE Live Expo - Summer'
          },
          type: {
            type: 'string',
            description: 'Festival category/type',
            example: 'Festival'
          },
          frequency: {
            type: 'string',
            description: 'How often the festival occurs',
            example: 'Annual'
          },
          submissionDates: {
            type: 'object',
            description: 'Submission period',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' },
              raw: { type: 'string', description: 'Original date string from source' }
            }
          },
          eventDates: {
            type: 'object',
            description: 'Event dates',
            properties: {
              start: { type: 'string', format: 'date-time' },
              end: { type: 'string', format: 'date-time' },
              raw: { type: 'string' }
            }
          },
          eventOfficialPage: {
            type: 'string',
            format: 'uri',
            description: 'Official festival website URL',
            example: 'https://indie.live/'
          },
          submissionForm: {
            type: 'string',
            format: 'uri',
            description: 'Direct link to submission form'
          },
          latestSteamPage: {
            type: 'string',
            format: 'uri',
            description: 'Steam sale/event page URL'
          },
          comments: {
            type: 'string',
            description: 'Additional notes about the festival'
          },
          source: {
            type: 'string',
            enum: ['curated', 'on-the-fence'],
            description: 'Data source (curated = verified, on-the-fence = unverified)'
          },
          enrichment: {
            $ref: '#/components/schemas/Enrichment'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Enrichment: {
        type: 'object',
        description: `
Auto-scraped enrichment data from festival websites.

**AI Context**: This data is automatically extracted by the enrichment service.
It may not always be accurate and should be used as supplementary information.
        `,
        properties: {
          imageUrl: {
            type: 'string',
            format: 'uri',
            description: 'Main promotional image (from Open Graph or Twitter cards)'
          },
          logoUrl: {
            type: 'string',
            format: 'uri',
            description: 'Festival logo image'
          },
          description: {
            type: 'string',
            description: 'Festival description (from meta tags)'
          },
          twitter: {
            type: 'string',
            format: 'uri',
            description: 'Twitter/X profile URL'
          },
          discord: {
            type: 'string',
            format: 'uri',
            description: 'Discord server invite URL'
          },
          location: {
            type: 'string',
            description: 'Event location (if detected)'
          },
          organizer: {
            type: 'string',
            description: 'Event organizer (if detected)'
          },
          verifiedAt: {
            type: 'string',
            format: 'date-time',
            description: 'When enrichment was successfully completed'
          },
          verificationStatus: {
            type: 'string',
            enum: ['pending', 'verified', 'failed', 'outdated'],
            description: 'Enrichment status'
          },
          lastCheckedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last enrichment attempt timestamp'
          }
        }
      },
      SteamFeature: {
        type: 'object',
        description: 'Steam featuring/sale event tracking record',
        properties: {
          _id: { type: 'string' },
          eventName: {
            type: 'string',
            description: 'Name of the Steam event',
            example: 'Steam Summer Sale'
          },
          year: {
            type: 'integer',
            description: 'Year of the event'
          },
          featuring: {
            type: 'string',
            description: 'Featuring status'
          },
          notes: {
            type: 'string',
            description: 'Additional notes'
          },
          registrationStart: { type: 'string', format: 'date-time' },
          registrationEnd: { type: 'string', format: 'date-time' },
          eventStart: { type: 'string', format: 'date-time' },
          eventEnd: { type: 'string', format: 'date-time' }
        }
      },
      SyncLog: {
        type: 'object',
        description: 'Record of a data synchronization operation',
        properties: {
          _id: { type: 'string' },
          syncType: {
            type: 'string',
            enum: ['full', 'partial'],
            description: 'Type of sync operation'
          },
          status: {
            type: 'string',
            enum: ['success', 'failed', 'partial']
          },
          festivalsCount: {
            type: 'integer',
            description: 'Number of festivals synced'
          },
          steamFeaturesCount: {
            type: 'integer',
            description: 'Number of Steam features synced'
          },
          syncErrors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Any errors encountered during sync'
          },
          startedAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' }
        }
      },
      SyncResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              festivalsCount: { type: 'integer' },
              steamFeaturesCount: { type: 'integer' },
              errors: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      },
      EnrichmentResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              total: { type: 'integer', description: 'Total processed' },
              enriched: { type: 'integer', description: 'Successfully enriched' },
              failed: { type: 'integer', description: 'Failed to enrich' },
              skipped: { type: 'integer', description: 'Skipped (no URL, etc.)' },
              errors: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      },
      FestivalStats: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              byType: {
                type: 'object',
                additionalProperties: { type: 'integer' }
              },
              bySource: {
                type: 'object',
                additionalProperties: { type: 'integer' }
              },
              withOpenSubmissions: { type: 'integer' }
            }
          }
        }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'error'] },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', description: 'Server uptime in seconds' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', description: 'Error message' }
        }
      }
    }
  }
};
