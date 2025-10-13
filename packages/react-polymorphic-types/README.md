# react-polymorphic-types

> This is a "fork" of [kripod/react-polymorphic-types](https://github.com/kripod/react-polymorphic-types) which fixes the types export declaration for TS when using a `moduleResolution` mode that relies on the package.json `exports` field.

---

Zero-runtime polymorphic component definitions for React

[![npm](https://img.shields.io/npm/v/react-polymorphic-types)](https://www.npmjs.com/package/react-polymorphic-types)

## Motivation

Being a successor to [react-polymorphic-box](https://github.com/kripod/react-polymorphic-box), this project offers more accurate typings with less overhead.

## Features

-   Automatic code completion, based on the value of the `as` prop
-   Static type checking against the associated component’s inferred props
-   HTML element name validation

## Usage

A `Heading` component can demonstrate the effectiveness of polymorphism:

```tsx
<Heading color="rebeccapurple">Heading</Heading>
<Heading as="h3">Subheading</Heading>
```

Custom components like the previous one may utilize the package as shown below.

```tsx
import type { PolymorphicPropsWithoutRef } from 'react-polymorphic-types';

// An HTML tag or a different React component can be rendered by default
export const HeadingDefaultElement = 'h2';

// Component-specific props should be specified separately
export type HeadingOwnProps = {
    color?: string;
};

// Extend own props with others inherited from the underlying element type
// Own props take precedence over the inherited ones
export type HeadingProps<T extends React.ElementType = typeof HeadingDefaultElement> = PolymorphicPropsWithoutRef<
    HeadingOwnProps,
    T
>;

export function Heading<T extends React.ElementType = typeof HeadingDefaultElement>({
    as,
    color,
    style,
    ...restProps
}: HeadingProps<T>) {
    const Element: React.ElementType = as || HeadingDefaultElement;
    return <Element style={{ color, ...style }} {...restProps} />;
}
```

---

⚠️ All the additional typings below will be deprecated as soon as [microsoft/TypeScript#30134](https://github.com/microsoft/TypeScript/issues/30134) is resolved.

### With [`React.forwardRef`](https://reactjs.org/docs/react-api.html#reactforwardref)

```tsx
import * as React from 'react';
import type {
    PolymorphicForwardRefExoticComponent,
    PolymorphicPropsWithRef,
    PolymorphicPropsWithoutRef,
} from 'react-polymorphic-types';

import { HeadingDefaultElement, HeadingOwnProps } from './Heading';

export type HeadingProps<T extends React.ElementType = typeof HeadingDefaultElement> = PolymorphicPropsWithRef<
    HeadingOwnProps,
    T
>;

export const Heading: PolymorphicForwardRefExoticComponent<HeadingOwnProps, typeof HeadingDefaultElement> =
    React.forwardRef(function Heading<T extends React.ElementType = typeof HeadingDefaultElement>(
        { as, color, style, ...restProps }: PolymorphicPropsWithoutRef<HeadingOwnProps, T>,
        ref: React.ForwardedRef<Element>
    ) {
        const Element: React.ElementType = as || HeadingDefaultElement;
        return <Element ref={ref} style={{ color, ...style }} {...restProps} />;
    });
```

### With [`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo)

```tsx
import * as React from 'react';
import type { PolymorphicMemoExoticComponent } from 'react-polymorphic-types';

import { Heading, HeadingDefaultElement, HeadingOwnProps } from './Heading';

export const MemoizedHeading: PolymorphicMemoExoticComponent<HeadingOwnProps, typeof HeadingDefaultElement> =
    React.memo(Heading);
```

### With [`React.lazy`](https://reactjs.org/docs/react-api.html#reactlazy)

```tsx
import * as React from 'react';
import type { PolymorphicLazyExoticComponent } from 'react-polymorphic-types';

import type { HeadingDefaultElement, HeadingOwnProps } from './Heading';

export const LazyHeading: PolymorphicLazyExoticComponent<HeadingOwnProps, typeof HeadingDefaultElement> = React.lazy(
    async () => {
        const { Heading } = await import('./Heading');
        return { default: Heading };
    }
);
```
