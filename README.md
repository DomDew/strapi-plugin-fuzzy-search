<img src="assets/logo.png" alt="fuzzy search logo" width="200"/>

# Strapi-plugin-fuzzy-search <!-- omit from toc -->

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-19-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

![Github CI](https://img.shields.io/github/actions/workflow/status/domdew/strapi-plugin-fuzzy-search/release.yml) ![Npm release](https://img.shields.io/npm/v/strapi-plugin-fuzzy-search?label=release) ![Npm monthly downloads](https://img.shields.io/npm/dm/strapi-plugin-fuzzy-search) ![License](https://img.shields.io/github/license/domdew/strapi-plugin-fuzzy-search) ![Coverage](https://img.shields.io/badge/Coverage-97.5%25-brightgreen.svg)

Register a weighted fuzzy search endpoint for Strapi Headless CMS you can add your content types to in no time.

Uses [fuzzysort](https://github.com/farzher/fuzzysort) under the hood: Simple, quick and easy. No need to worry about setting up an instance for a complex search engine.

## Table of Contents <!-- omit from toc -->

- [Roadmap 🏗️](#roadmap-️)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Options/Config](#optionsconfig)
    - [General Options](#general-options)
    - [Fuzzysort Options](#fuzzysort-options)
    - [Full Example config](#full-example-config)
  - [A note on performance:](#a-note-on-performance)
- [Usage](#usage)
  - [Basic Search](#basic-search)
    - [Example Requests](#example-requests)
      - [REST](#rest)
      - [GraphQl](#graphql)
    - [Example Responses](#example-responses)
      - [REST](#rest-1)
      - [GraphQl](#graphql-1)
  - [Search Metadata](#search-metadata)
  - [Pagination](#pagination)
    - [REST](#rest-2)
    - [GraphQL](#graphql-2)
  - [Population](#population)
    - [REST](#rest-3)
    - [GraphQL](#graphql-3)
  - [Filters](#filters)
    - [REST](#rest-4)
    - [GraphQL](#graphql-4)
  - [Filter by Content Type (REST)](#filter-by-content-type-rest)
- [Why use fuzzysort and not something like Fuse.js?](#why-use-fuzzysort-and-not-something-like-fusejs)
- [Contributing](#contributing)
- [Found a bug?](#found-a-bug)
- [Contributors ✨](#contributors-)

# Roadmap 🏗️

- ✅ Return indices/highlights of matches (via `includeMatches` config)
- Improve response performance
- Include option to hide unpublished content by default
- Allow single types as content types
- Pass configuration as query params/args
  - Configure fuzzysort through params/args per content type

# Requirements

Strapi Version `>= v5.1.1`

For compatibility with older Strapi versions please use older Versions of this package (<= 1.11.2 and <= 2.0.3)

# Installation

Enable the fuzzy-search plugin in the `./config/plugins.js` of your Strapi project.

Make sure to set the appropriate permissions for the `search` route in the `Permissions` tab of the `Users & Permission Plugin` for the role to be able to access the search route.

## Options/Config

Mandatory settings are marked with `*`.

### General Options

The plugin requires several configurations to be set in the `.config/plugins.js` file of your Strapi project to work.

| Key            | Type             | Notes                                                                                                                                                                                                                                                                                                                               |
| -------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| contentTypes\* | Array of Objects | List the content types you want to register for fuzzysort. Each object requires the `uid: string` and `modelName: string` to be set for a content type                                                                                                                                                                              |
| includeMatches | boolean          | Global setting to include search metadata (score and match indexes) in the response. Can be overridden per content type. Default: `false`.                                                                                                                                                                                         |
| transliterate  | boolean          | If this is set to true the search will additionally run against transliterated versions of the content for the keys specified in the keys array for a given content type. E.g. `你好` will match for `ni hao`. Note that activating this feature for a content type comes at a performance cost and may increase the response time. |

**IMPORTANT:** Please note that as of now, only collectionTypes are supported as contentTypes.

### Fuzzysort Options

The `fuzzysortOptions` allow for some finetuning of fuzzysorts searching algorithm to your needs.

| Key            | Type             | Notes                                                                                                                                                                                                                       |
| -------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| characterLimit | int (positive)   | Limits the length of characters the algorithm is searching through for any string of the content type                                                                                                                       |
| threshold      | float (positive)   | Sets the threshold for the score of the entries that will be returned. The lower, the "fuzzier" the results.                                                                                                                |
| limit          | int (positive)   | Limits the amount of entries returned from the search                                                                                                                                                                       |
| keys\*         | array of objects | Lists the fields of the models the algorithm should search `(name: string)` and a factor to weight them by `weight: float`. The higher the weight, the higher a match for a given field will be evaluated for a content type. |

### Full Example config

```JavaScript
module.exports = ({ env }) => ({
  // ...

  "fuzzy-search": {
    enabled: true,
    config: {
      // Global setting (optional, default: false)
      includeMatches: true,
      contentTypes: [
        {
          uid: "api::author.author",
          modelName: "author",
          transliterate: true,
          // Override global includeMatches for this content type (optional)
          includeMatches: false,
          fuzzysortOptions: {
            characterLimit: 300,
            threshold: 0.6,
            limit: 10,
            keys: [
              {
                name: "name",
                weight: 0.1,
              },
              {
                name: "description",
                weight: -0.1,
              },
            ],
          },
        },
        {
          uid: "api::book.book",
          modelName: "book",
          fuzzysortOptions: {
            characterLimit: 500,
            keys: [
              {
                name: "title",
                weight: 0.2,
              },
              {
                name: "description",
                weight: -0.2,
              },
            ],
          },
        },
      ],
    },
  },

  // ...
});
```

## A note on performance:

A high `characterLimit`, `limit`, a low `threshold` (the lower the value the more matches) as well as setting `transliterate: true` all hamper the performance of the search algorithm. We recommend that you start out with a `characterLimit: 500`, `threshold: 0.5`, `limit: 15` and work your way from there. The characterLimit especially can be quite delicate, so make sure to test every scenario when dialing in it's value.

# Usage

## Basic Search

Hitting the `/api/fuzzy-search/search?query=<your-query-string>` will return an array of matched entries for each content type registered in the config. If no match could be found an empty array will be returned. The endpoint accepts an optional `locale=<your-locale>` query as well.

Alternatively (and if the graphql plugin is installed), a search query is registered that accepts `query: String!` and `locale: String` (optional) as arguments. If set, the locale parameter will be used as a default for all queried content types. If you'd rather filter the content types by local on an individual level, pass the locale to the content type as a [filter](#filters) parameter.

**IMPORTANT:** Please note that in order to query for the locale of the content types via the locale parameter, localization must be enabled for the content types.

### Example Requests

#### REST

```JavaScript
await fetch(`${API_URL}/api/fuzzy-search/search?query=deresh&locale=en`);
// GET /api/fuzzy-search/search?query=deresh&locale=en
```

#### GraphQl

```graphql
query {
  search(query: "deresh", locale: "en") {
    authors {
      data {
        attributes {
          name
        }
      }
    }
    books {
      data {
        attributes {
          title
          description
        }
      }
    }
  }
}
```

### Example Responses

**IMPORTANT:** Please note that as of now published as well as unpublished entries will be returned by default. Modify this behavior by passing a [filter](#filters) to the query.

#### REST

```json
{
  "authors": [
    {
      "id": 1,
      "name": "Любко Дереш",
      "description": "As an author, Lyubko has had somewhat of a cult-like following among the younger generation in Ukraine since the appearance of his novel Cult at age eighteen, which was followed almost immediately by the publication of another novel, written in early high school.",
      "createdAt": "2022-05-05T13:08:19.312Z",
      "updatedAt": "2022-05-05T13:34:46.488Z",
      "publishedAt": "2022-05-05T13:22:17.310Z"
    }
  ],
  "books": [
    {
      "id": 1,
      "title": "Jacob's Head",
      "description": "Jacob’s Head by Lyubko Deresh is scheduled to be adapted into a movie in Ukraine in the near future.",
      "createdAt": "2022-05-05T13:08:43.816Z",
      "updatedAt": "2022-05-05T13:24:07.107Z",
      "publishedAt": "2022-05-05T13:22:23.764Z"
    }
  ]
}
```

#### GraphQl

```json
{
  "data": {
    "search": {
      "authors": {
        "data": [
          {
            "attributes": {
              "name": "Любко Дереш"
            }
          }
        ]
      },
      "books": {
        "data": [
          {
            "attributes": {
              "title": "Jacob's Head",
              "description": "Jacob’s Head by Lyubko Deresh is scheduled to be adapted into a movie in Ukraine in the near future."
            }
          }
        ]
      }
    }
  }
}
```

## Search Metadata

When `includeMatches` is enabled (either globally or per content type), each result will include a `searchMeta` object containing:

- **score**: The weighted overall match score (higher is better)
- **matches**: Per-field match information with `score` and `indexes` for each searchable field

The `indexes` array contains the character positions that matched in the original string, following fuzzysort's native format. This allows you to implement custom highlighting on the client side.

### Example Response with Search Metadata

**REST:**

```json
{
  "authors": [
    {
      "id": 1,
      "name": "Любко Дереш",
      "description": "As an author, Lyubko has had somewhat of a cult-like following...",
      "searchMeta": {
        "score": 0.95,
        "matches": {
          "name": {
            "score": 0.95,
            "indexes": [8, 9, 10, 11, 12]
          },
          "description": {
            "score": null,
            "indexes": null
          }
        }
      }
    }
  ]
}
```

**GraphQL:**

```graphql
query {
  search(query: "deresh") {
    authors {
      data {
        attributes {
          name
        }
        searchMeta {
          score
          matches
        }
      }
    }
  }
}
```

**Note**: If a field doesn't match the query, its `score` and `indexes` will be `null`.

## Pagination

### REST

The endpoint accepts query parameters in line with Strapis [pagination by page](https://docs.strapi.io/dev-docs/api/rest/sort-pagination#pagination-by-page) parameters. The difference being that the pagination is scoped for the content types individually.

**Important**: Please note that if pagination parameters are passed for a content type, it's data will now be available under the key `data`, whereas the pagination meta data can be found under the key `meta`.

| Parameter                            | Type    | Description                                                               | Default |
| ------------------------------------ | ------- | ------------------------------------------------------------------------- | ------- |
| pagination[myContentType][page]      | Integer | Page number                                                               | 1       |
| pagination[myContentType][pageSize]  | Integer | Page size                                                                 | 25      |
| pagination[myContentType][withCount] | Boolean | Adds the total numbers of entries and the number of pages to the response | True    |

Please note that [myContentType] needs to be in the plural form. For example, for the content type "author," the correct parameter is "authors".


**Request:**

```JavaScript
await fetch(`${API_URL}/api/fuzzy-search/search?query=deresh&pagination[authors][pageSize]=2&pagination[authors][page]=3`);
// GET /api/fuzzy-search/search?query=deresh&pagination[authors][pageSize]=2&pagination[authors][page]=3
```

**Response:**

```json
{
  "authors": [
    // ...
  ],
  "books": {
    "data": [
      // ...
    ],
    "meta": {
      "pagination": {
        "page": 3,
        "pageSize": 2,
        "total": 6,
        "pageCount": 3
      }
    }
  }
}
```

### GraphQL

The endpoint accepts pagination arguments in line with Strapis [pagination by page](https://docs.strapi.io/dev-docs/api/graphql#pagination-by-page) and [pagination by offset](https://docs.strapi.io/dev-docs/api/graphql#pagination-by-offset) parameters.

| Parameter            | Description                  | Default |
| -------------------- | ---------------------------- | ------- |
| pagination[page]     | Page number                  | 1       |
| pagination[pageSize] | Page size                    | 10      |
| pagination[start]    | Start value                  | 0       |
| pagination[limit]    | Number of entities to return | 10      |

**IMPORTANT:** Please note that in line with Strapis defaults, pagination methods can not be mixed. Always use either page with pageSize or start with limit.

**Request:**

```graphql
search(query: "deresh") {
  books(pagination: { page: 3, pageSize: 2 }) {
    data {
      attributes {
        title
      }
    }
    meta {
      pagination {
        page
        pageSize
        pageCount
        total
      }
    }
  }
}
```

**Response:**

```json
{
  "data": {
    "search": {
      "books": {
        "data": [
          // ...
        ],
        "meta": {
          "pagination": {
            "page": 3,
            "pageSize": 2,
            "pageCount": 3,
            "total": 6
          }
        }
      }
    }
  }
}
```

## Population

### REST

The endpoint accepts query parameters in line with Strapis [populate](https://docs.strapi.io/dev-docs/api/rest/populate-select#population) parameters. The difference being that the population is scoped for the content types individually.

| Parameter                            | Type    | Description                                                               |
| ------------------------------------ | ------- | ------------------------------------------------------------------------- |
| population[myContentType]     | String/PopulationParams | Either pass a string for the relation to populate directly, or build more complex population queries in line with the [official documentation on population](https://docs.strapi.io/dev-docs/api/rest/populate-select#population) like in the example below. |


**Request:**

```JavaScript
await fetch(`${API_URL}/api/fuzzy-search/search?query=deresh&populate[books][author][populate][0]=city`);
// GET /api/fuzzy-search/search?query=deresh&populate[books][author][populate][0]=city
```

**Response:**

```json
{
  "authors": [
    // ...
  ],
  "books": [
    {
      "id": 1,
      "title": "A good book",
      "description": "Written by Lyubko Deresh",
      "createdAt": "2022-09-21T16:16:07.365Z",
      "updatedAt": "2023-07-24T12:00:51.624Z",
      "publishedAt": "2022-09-21T16:16:09.973Z",
      "locale": "en",
      "author": {
        "id": 2,
        "name": "Любко Дереш",
        "description": "A poet, novelist, essayist, and translator.",
        "createdAt": "2022-09-24T12:39:34.669Z",
        "updatedAt": "2023-11-10T12:28:22.828Z",
        "publishedAt": "2022-09-24T12:39:53.945Z",
        "locale": "en",
        "city": {
          "id": 1,
          "name": "Pustomyty",
          "createdAt": "2023-11-10T12:26:29.981Z",
          "updatedAt": "2023-11-10T12:26:32.254Z",
          "publishedAt": "2023-11-10T12:26:32.252Z"
        }
      }
    }
  ]
}
```

### GraphQL

See [Strapis official GraphQL documentation for queries](https://docs.strapi.io/dev-docs/api/graphql#queries).

## Filters

### REST

The endpoint accepts query parameters in line with Strapis [filter parameters](https://docs.strapi.io/dev-docs/api/rest/filters-locale-publication#filtering) parameters. The difference being that the filters are scoped for the content types individually.

**Request:**

```JavaScript
await fetch(`${API_URL}/api/fuzzy-search/search?query=deresh&filters[books][publishedAt][$notNull]=true`);
// GET /api/fuzzy-search/search?query=deresh&filters[books][publishedAt][$notNull]=true
```

**Response:**

```json
{
  "authors": [
    // ...
  ],
  "books": {
    "data": [
      {
        "id": 3,
        "title": "A good book",
        "description": "Written by Lyubko Deresh",
        "createdAt": "2023-02-27T08:11:11.771Z",
        "updatedAt": "2023-02-27T08:11:12.208Z",
        "publishedAt": "2023-02-27T08:11:12.207Z",
        "locale": "en"
      }
    ]
  }
}
```

### GraphQL

The endpoint accepts filter arguments in line with Strapis [filters parameter](https://docs.strapi.io/dev-docs/api/graphql#filters) .

**Request:**

```graphql
search(query: "deresh") {
  books(filters: { publishedAt: { notNull: true } }) {
    data {
      attributes {
        title
      }
    }
  }
}
```

**Response:**

```json
{
  "data": {
    "search": {
      "books": {
        "data": [
          {
            "attributes": {
              "title": "A good book"
            }
          }
        ]
      }
    }
  }
}
```

## Filter by Content Type (REST)

The REST-endpoint accepts an optional parameter to select only some content types the fuzzy search should run for.

| Parameter             | Type   | Description                                                     |
| --------------------- | ------ | --------------------------------------------------------------- |
| filters[contentTypes] | string | Comma seperated list of the content types to run the search for |

**Request:**

```JavaScript
await fetch(`${API_URL}/api/fuzzy-search/search?query=deresh&filters[contentTypes]=books,authors`);
// GET /api/fuzzy-search/search?query=deresh&filters[contentTypes]=books
```

**Response:**

```json
{
  "authors": [
    // ...
  ],
  "books": [
    // ...
  ]
}
```

# Why use fuzzysort and not something like Fuse.js?

While [Fuse.js](https://github.com/krisk/Fuse) proofs to be an amazing library, it can yield unexpected results and what is to be perceived as "false positives" (by a human) when searching through longer strings. Fuzzysort aims to solve this problem by introducing the evaluation and scoring of exact matches. Since we had issues with Fuse.js and it's underlying algorithm, we opted for fuzzysearch to do the heavy lifting instead.

# Contributing

Feel free to contribute, PRs are always welcome!

Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for reference.

# Found a bug?

If you found a bug or have any questions please [submit an issue](https://github.com/DomDew/strapi-plugin-fuzzy-search/issues). If you think you found a way how to fix it, please feel free to create a pull request!

# Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/felex0982"><img src="https://avatars.githubusercontent.com/u/14078988?v=4?s=100" width="100px;" alt="Felix Wagner"/><br /><sub><b>Felix Wagner</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=felex0982" title="Documentation">📖</a> <a href="#design-felex0982" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wuestefeld"><img src="https://avatars.githubusercontent.com/u/33458141?v=4?s=100" width="100px;" alt="wuestefeld"/><br /><sub><b>wuestefeld</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=wuestefeld" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DomDew"><img src="https://avatars.githubusercontent.com/u/72755955?v=4?s=100" width="100px;" alt="Dominik"/><br /><sub><b>Dominik</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=DomDew" title="Code">💻</a> <a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=DomDew" title="Documentation">📖</a> <a href="#ideas-DomDew" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/pulls?q=is%3Apr+reviewed-by%3ADomDew" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.me.com"><img src="https://avatars.githubusercontent.com/u/17861353?v=4?s=100" width="100px;" alt="Rotar Rares"/><br /><sub><b>Rotar Rares</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=rotarrares" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nhvu1988.com/"><img src="https://avatars.githubusercontent.com/u/13212737?v=4?s=100" width="100px;" alt="Nguyễn Hoàng Vũ"/><br /><sub><b>Nguyễn Hoàng Vũ</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=nhvu1988" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://chrismps.netlify.app/"><img src="https://avatars.githubusercontent.com/u/21962584?v=4?s=100" width="100px;" alt="Chris Michael"/><br /><sub><b>Chris Michael</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3AChrisMichaelPerezSantiago" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Sunny-Pirate"><img src="https://avatars.githubusercontent.com/u/109725967?v=4?s=100" width="100px;" alt="Luca Faccio"/><br /><sub><b>Luca Faccio</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3ASunny-Pirate" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aomalik"><img src="https://avatars.githubusercontent.com/u/44109070?v=4?s=100" width="100px;" alt="aomalik"/><br /><sub><b>aomalik</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Aaomalik" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/signorekai"><img src="https://avatars.githubusercontent.com/u/12168407?v=4?s=100" width="100px;" alt="Alfred Lau"/><br /><sub><b>Alfred Lau</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Asignorekai" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/philgran"><img src="https://avatars.githubusercontent.com/u/12853?v=4?s=100" width="100px;" alt="Phil Gran"/><br /><sub><b>Phil Gran</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Aphilgran" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.ddazal.com"><img src="https://avatars.githubusercontent.com/u/21014225?v=4?s=100" width="100px;" alt="David Daza"/><br /><sub><b>David Daza</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=ddazal" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aadelgrossi"><img src="https://avatars.githubusercontent.com/u/6358947?v=4?s=100" width="100px;" alt="Andre Grossi"/><br /><sub><b>Andre Grossi</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Aaadelgrossi" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.linkedin.com/in/jesúsr00"><img src="https://avatars.githubusercontent.com/u/68043863?v=4?s=100" width="100px;" alt="Jesús Reikel López Martín"/><br /><sub><b>Jesús Reikel López Martín</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Ajesusr00" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/prborisov17"><img src="https://avatars.githubusercontent.com/u/131133955?v=4?s=100" width="100px;" alt="prborisov17"/><br /><sub><b>prborisov17</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Aprborisov17" title="Bug reports">🐛</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.amityweb.co.uk"><img src="https://avatars.githubusercontent.com/u/1562777?v=4?s=100" width="100px;" alt="Laurence Cope"/><br /><sub><b>Laurence Cope</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3Aamityweb" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.pavelglac.com/"><img src="https://avatars.githubusercontent.com/u/42679661?v=4?s=100" width="100px;" alt="Pavel Glac"/><br /><sub><b>Pavel Glac</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=pavelglac" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sauer.dev"><img src="https://avatars.githubusercontent.com/u/126874219?v=4?s=100" width="100px;" alt="Leon Sauer"/><br /><sub><b>Leon Sauer</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=Lon3035" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lsarni"><img src="https://avatars.githubusercontent.com/u/15196342?v=4?s=100" width="100px;" alt="Lucia Sarni"/><br /><sub><b>Lucia Sarni</b></sub></a><br /><a href="#question-lsarni" title="Answering Questions">💬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Moonlight63"><img src="https://avatars.githubusercontent.com/u/7518189?v=4?s=100" width="100px;" alt="Dalen Catt"/><br /><sub><b>Dalen Catt</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=Moonlight63" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
