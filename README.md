<img src="assets/logo.png" alt="fuzzy search logo" width="200"/>

# Strapi-plugin-fuzzy-search

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-7-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

Register a weighted fuzzy search endpoint for Strapi Headless CMS you can add your content types to in no time.

Uses [fuzzysort](https://github.com/farzher/fuzzysort) under the hood: Simple, quick and easy. No need to worry about setting up an instance for a complex search engine.

**Roadmap:**

- Include more fuzzysort options
- Return better errors

# Requirements

Strapi Version v4.x.x

# Installation

Enable the fuzzy-search plugin in the `./config/plugins.js` of your Strapi project.

Make sure to set the appropriate permissions for the `search` route in the `Permissions` tab of the `Users & Permission Plugin` for the role to be able to access the search route.

## Options/Config

Mandatory settings are marked with `*`.

### General Options

The plugin requires several configurations to be set in the `.config/plugins.js` file of your Strapi project to work.

| Key              | Type             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| contentTypes\*   | Array of Objects | List the content types you want to register for fuzzysort. Each object requires the `uid: string` and `modelName: string` to be set for a content type                                                                                                                                                                                                                                                                                                                                                         |
| transliterate    | boolean          | If this is set to true the search will additionally run against transliterated versions of the content for the keys specified in the keys array for a given content type. E.g. `你好` will match for `ni hao`. Note that activating this feature for a content type comes at a performance cost and may increase the response time.                                                                                                                                                                            |
| queryConstraints | Object           | Manipulate the db query that queries for the entries of a model, e.g. as to only select articles that have been published. These constraints to the underlying `findMany()` query are built with the [logical operators](https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/query-engine/filtering.html#logical-operators) of [Strapis Query Engine API](https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/query-engine-api.html) |

### Fuzzysort Options

The `fuzzysortOptions` allow for some finetuning of fuzzysorts searching algorithm to your needs.

| Key            | Type             | Notes                                                                                                                                                                                                                       |
| -------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| characterLimit | int (positive)   | Limits the length of characters the algorithm is searching through for any string of the content type                                                                                                                       |
| threshold      | int (negative)   | Sets the threshold for the score of the entries that will be returned. The lower, the "fuzzier" the results.                                                                                                                |
| limit          | int (positive)   | Limits the amount of entries returned from the search                                                                                                                                                                       |
| keys\*         | array of objects | Lists the fields of the models the algorithm should search `(name: string)` and a factor to weight them by `weight: int`. The higher the weight, the higher a match for a given field will be evaluated for a content type. |

### Full Example config

```JavaScript
module.exports = ({ env }) => ({
  // ...

  "fuzzy-search": {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: "api::author.author",
          modelName: "author",
          transliterate: true,
          queryConstraints: {
            where: {
              $and: [
                {
                  publishedAt: { $notNull: true },
                },
              ],
            },
          },
          fuzzysortOptions: {
            characterLimit: 300,
            threshold: -600,
            limit: 10,
            keys: [
              {
                name: "name",
                weight: 100,
              },
              {
                name: "description",
                weight: -100,
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
                weight: 200,
              },
              {
                name: "description",
                weight: -200,
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

A high `characterCount`, `threshold` and `limit` as well as setting `transliterate: true` all hamper the performance of the search algorithm. We recommend that you start out with a `characterCount: 500`, `threshold: -1000`, `limit: 15` and work your way from there. The characterCount especially can be quite delicate, so make sure to test every scenario when dialing in it's value.

# Usage

## Search

Hitting the `/api/fuzzy-search/search?query=<your-query-string>` will return an array of matched entries for each content type registered in the config. If no match could be found an empty array will be returned. The endpoint accepts an optional `locale=<your-locale>` query as well.

Alternatively (and if the graphql plugin is installed), a search query is registered that accepts `query: String!` and `locale: String` (optional) as arguments.

**IMPORTANT:** Please not that in order to query for the locale of a content type, localization must be enabled for the content type.

# Examples

## Example Requests

### REST

```JavaScript
await fetch(`${API_URL}/api/fuzzy-search/search?query=deresh&locale=en`);
// GET /api/fuzzy-search/search?query=john&locale=en
```

### GraphQl

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

## Example Responses

**IMPORTANT:** Please note that as of now published as well as unpublished entries will be returned.

### REST

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

### GraphQl

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

# Why use fuzzysort and not something like Fuse.js?

While [Fuse.js](https://github.com/krisk/Fuse) proofs to be an amazing library, it can yield unexpected results and what is to be perceived as "false positives" (by a human) when searching through longer strings. Fuzzysort aims to solve this problem by introducing the evaluation and scoring of exact matches. Since we had issues with Fuse.js and it's underlying algorithm, we opted for fuzzysearch to do the heavy lifting instead.

# Found a bug?

If you found a bug or have any questions please [submit an issue](https://github.com/DomDew/strapi-plugin-fuzzy-search/issues). If you think you found a way how to fix it, please feel free to create a pull request!

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/felex0982"><img src="https://avatars.githubusercontent.com/u/14078988?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Felix Wagner</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=felex0982" title="Documentation">📖</a> <a href="#design-felex0982" title="Design">🎨</a></td>
      <td align="center"><a href="https://github.com/wuestefeld"><img src="https://avatars.githubusercontent.com/u/33458141?v=4?s=100" width="100px;" alt=""/><br /><sub><b>wuestefeld</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=wuestefeld" title="Code">💻</a></td>
      <td align="center"><a href="https://github.com/DomDew"><img src="https://avatars.githubusercontent.com/u/72755955?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dominik</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=DomDew" title="Code">💻</a> <a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=DomDew" title="Documentation">📖</a> <a href="#ideas-DomDew" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/pulls?q=is%3Apr+reviewed-by%3ADomDew" title="Reviewed Pull Requests">👀</a></td>
      <td align="center"><a href="http://www.me.com"><img src="https://avatars.githubusercontent.com/u/17861353?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rotar Rares</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=rotarrares" title="Code">💻</a></td>
      <td align="center"><a href="https://nhvu1988.com/"><img src="https://avatars.githubusercontent.com/u/13212737?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nguyễn Hoàng Vũ</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/commits?author=nhvu1988" title="Code">💻</a></td>
      <td align="center"><a href="https://chrismps.netlify.app/"><img src="https://avatars.githubusercontent.com/u/21962584?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Chris Michael</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3AChrisMichaelPerezSantiago" title="Bug reports">🐛</a></td>
      <td align="center"><a href="https://github.com/Sunny-Pirate"><img src="https://avatars.githubusercontent.com/u/109725967?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Luca Faccio</b></sub></a><br /><a href="https://github.com/DomDew/strapi-plugin-fuzzy-search/issues?q=author%3ASunny-Pirate" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
