# Offers

Offers are time-based promotions that run throughout the year. The offer system allows developers to create offers that are available on one or several products. The system is built around a set of files and configuration that will be presented in this document.

> Some offers are always available for users. For example, the "monthly subscription nudge" is offered to all users subscribed to a monthly plan and offers them the opportunity to upgrade to a yearly plan. Those are "permanent offers"; they are handled in the `TopNavbarPostSignupPromo` folder.

## File structure of the offer management

- `components` contains reusable components. Some are made for one specific offer, and others can be shared.
- `helpers` contains copy, eligibility, subscription-related helpers. Some are made for one specific offer, and others can be shared.
- `hooks` contains the main hook for offers `useOfferConfig.ts`, this file is handling which offer to show to the user.
- `operations` contains the offer-related code. This ranges from the offer layout, to the configuration (`configuration.ts`), the eligibility (`eligibility.ts`), and the main hook (`useOffer.ts`). Note that each plan requires a different offer.
- `interface.ts` contains the `OfferId`, which contains all the IDs of running or past offers.

## Creating an offer

In the following part of this document, we'll imagine creating an offer for a spring cleaning campaign. The main ID of the offer is `spring-cleaning-2026`. This fake offer would be available for Mail Plus, Drive Plus, and Bundle.

### Operations creation

Since the offer is available for Mail Plus, Drive Plus and Bundle, we need to create three different operations for each plan.

The following operations are required:

- `springCleaning2026MailPlus`
- `springCleaning2026DrivePlus`
- `springCleaning2026Bundle`

Each operation will have its own `configuration.ts`, `eligibility.ts`, and `useOffer.ts` files. This allows granular control over each offer behavior.

The layout of all the offers can be shared and put in the `components` folders for easy organization.

### Required feature flags

#### Offer-specific flags

Since we have three operations, we need to create three feature flags on the Admin Panel, one for each operation. Those feature flags need to follow some naming conventions:

- PascalCase
- Prefixed by `Offer`
- Suffixed by year and plan
- Ex: `OfferSpringCleaning2026MailPlus`, `OfferSpringCleaning2026DrivePlus`, `OfferSpringCleaning2026Bundle`

Those flags will save the state of the offer for each user.

#### Global flag

On top of those three flags, the `Offers` Admin Panel flag must contain the offer IDs. Those IDS are found in several places; they are defined in each offer `configuration.ts` file. In the `OfferId` in the `interface.ts` file.

For our offer, it would look like this:

- `spring-cleaning-2026-mail-plus`
- `spring-cleaning-2026-drive-plus`
- `spring-cleaning-2026-bundle`

They are part of a JSON feature flag; the keys are the offer IDs, and the values are a boolean indicating if the offer is enabled.

### Update the main offer hook

Once the offers are created, the last step is to update the main offer hook. This hook is responsible for fetching the offers from the API and displaying whatever is available to the user.

For this part, you need to import the config and the hook in `useOfferConfig`.

**Important**: The order of offers in the `allOffers` array matters! Offers are processed in order, and the first valid offer will be shown to the user.

In our example, we would have the following changes:

```typescript
import { useSpringCleaning2026MailPlus } from '../operations/springCleaning2026MailPlus/useOffer';
import { useSpringCleaning2026DrivePlus } from '../operations/springCleaning2026DrivePlus/useOffer';
import { useSpringCleaning2026Bundle } from '../operations/springCleaning2026Bundle/useOffer';
import { springCleaning2026MailPlus } from '../operations/springCleaning2026MailPlus/configuration';
import { springCleaning2026DrivePlus } from '../operations/springCleaning2026DrivePlus/configuration';
import { springCleaning2026Bundle } from '../operations/springCleaning2026Bundle/configuration';


const configs: Record<OfferId, OfferConfig> = {
    ...
    'spring-cleaning-2026-mail-plus': springCleaning2026MailPlus,
    'spring-cleaning-2026-drive-plus': springCleaning2026DrivePlus,
    'spring-cleaning-2026-bundle': springCleaning2026Bundle,
    ...
}

const useOfferConfig = (): [OfferConfig | undefined, boolean] => {
...

    const springCleaning2026MailPlus = useSpringCleaning2026MailPlus();
    const springCleaning2026DrivePlus = useSpringCleaning2026DrivePlus();
    const springCleaning2026Bundle = useSpringCleaning2026Bundle();

    ...

    const allOffers: Operation[] = [
        ...
        springCleaning2026MailPlus,
        springCleaning2026DrivePlus,
        springCleaning2026Bundle,
        ...
    ];

    ...
};
```

### Cleaning of the offer

The code can be cleaned once the offer is finished. This means deleting the operations folders, removing the IDs from the `OfferId` in the `interface.ts` file,...

The Admin Panel feature flags can be removed as well, but the deployed code should not include references to them as it could result in 500 errors.

The process is as follows:

- Delete the code and all references to the offers
- Wait for the code to be deployed everywhere (1 month to be super safe)
- Delete the offers-related flags and remove the IDs from the `Offers` flag

## Implementation examples

The following merge request contains most of the implementation of the Valentine's day offer: 15339
