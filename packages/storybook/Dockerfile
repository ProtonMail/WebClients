ARG PLAYWRIGHT_VERSION="v1.51.1"

FROM node:22.14.0-alpine AS build

WORKDIR /clients

COPY . .

RUN corepack enable && \
    yarn install --mode=skip-build --immutable

WORKDIR /clients/packages/storybook

RUN yarn storybook:build

FROM harbor.protontech.ch/mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION}-noble AS tests

# TODO: Only copy what's needed for Storybook
COPY --from=build /clients /clients

WORKDIR /clients/packages/storybook

CMD yarn storybook:build:serve & exec bash
