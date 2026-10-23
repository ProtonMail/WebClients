# @proton/icons

This package contains [icon set](https://design-system.protontech.ch/?path=/docs/core-concepts-icons--icons) used across Proton's products.

The icons are consumed as auto-generated React components.

## Consuming the Icon React components

```js
import { IcGlobe } from '@proton/icons/icons/IcGlobe';

const MyComponent = () => <IcGlobe size={6} />;
```

Icons are tree shaken, so any icons you do not use will not be included in the bundle.

File type icons, such as the PDF or folder icon, live in `@proton/file-icons`.

## Update the icons

In case some icons need to be changed/added, the process is:

- edit the `assets/sprite-icons.svg` file (making the relevant changes there)
- run `pnpm --filter @proton/icons run build` to generate the React components
