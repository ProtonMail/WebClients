# @proton/icons

This package contains [icon set](https://design-system.protontech.ch/?path=/docs/core-concepts-icons--icons) used across Proton's products.

There are 2 ways of consuming this package:

-   Using the auto-generated React components (recommended)
-   Using the sprite file

## Consuming the Icon React components

```js
import { IcGlobe } from '@proton/icons';

const MyComponent = () => <IcGlobe size={6} />;
```

Icons are tree shaken, so any icons you do not use will not be included in the bundle.

## Using the SVG sprite

You can use the `Icons.tsx` component to import the sprite.

Then you can use the [Icon component](https://design-system.protontech.ch/?path=/docs/components-icon--basic).

## Update the icons

In case some icons need to be changed/added, the process is:

-   edit the `assets/sprite-icons.svg` file (making the relevant changes there)
-   run `yarn workspace @proton/icons build` to generate the React components
