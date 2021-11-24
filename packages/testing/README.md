# Testing

The testing package contains common mocks and test data to use across the monorepo.

## Builders

Builders are using [test-data-bot](https://github.com/jackfranklin/test-data-bot) to generate data structures according to our types. It is reasonably flexible, allowing to create variations by using `traits` and using overrides, have some random and/or fixed fields and use builders within builders.

## Handlers

Handlers are for [Mock Service Worker](https://mswjs.io) to use in mock API responses. It can be used both in tests as well as client side when needed. `handlers.ts` responses are loaded by default, but you can override via `server.use` and injecting a `rest.get` to override an existing handler.

## Mocks

The mocks are all blank apart from the API. The simple API mock is necessary to allow the use of `MSW`.
