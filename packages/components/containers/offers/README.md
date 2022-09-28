# Offers

The goal was to give developer a platform allowing them to create offers operations with a single, well typed, config file. And if customisation is needed, components are modular enough to give the needed flexibility to make it in a fast and reusable way.

## Create a new offer

In order to create a new offer, few steps are needed.

### Create FeatureCode

In `FeaturesContext.ts`, insert a new FeatureCode for the offer. **FeatureCode name must respect naming conventions**:

-   PascalCase
-   Prefixed by `Offer`
-   Suffixed by year
-   Ex: `OfferBlackFriday2022`

### Add an offer-id

Add an offer ID (for frontend purpose only) in `interface.ts` `OfferId` union type.

### Create operation folder

Create a new folder inside `operations`. Name should be same as featureFlag without the prefix and camelCased.

Ex: If FF is `OfferBlackFriday2022` folder name will be `blackFriday2022`.

Then create and fill `configuration.ts`, `useOffer.ts`, `Layout.tsx` and `index.ts` files.

Be carefull with naming exports in `index.ts`.

Ex:

```ts
export { default as blackFriday2022Config } from './configuration';
export { default as useBlackFriday2022 } from './useOffer';
```

### Add operation to main hook

Import the config and the hook in `useOfferConfig`.
