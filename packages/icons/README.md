# @proton/icons

This package contains the base icons used across Proton's products.

There are 2 ways of consuming this package:

-   using the raw `sprite-icons.svg` file (legacy way)
-   using the auto-generated React components (recommended)

## Consuming the Icon React components

```js
import { IcGlobe } from '@proton/icons/lib/IcGlobe';

const MyComponent = () => <IcGlobe className="size-6" />;
```

## Directly using the SVG sprite

```js
import sprite from '@proton/icons/assets/sprite-icons.svg';
```

## Listing all the available icons

In case you need to loop over all the icons that exists, there is a special export `all` that exports all the icons

```jsx
import * as Icons from '@proton/icons/lib/all';

const MyComponent = () => {
    return (
        <div>
            {Object.keys(Icons).map((key) => {
                const Icon = Icons[key];
                return <Icon key={key} className="size-6" />;
            })}
        </div>
    );
};
```

## Update the icons

In case some icons need to be changed/added, the process is:

-   edit the `assets/sprite-icons.svg` file (making the relevant changes there)
-   run `yarn build` to generate the React components
