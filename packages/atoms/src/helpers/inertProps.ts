import type { HTMLAttributes } from 'react';
import { version } from 'react';

/** `''` with the React 18 types, which have no `inert` prop, and `boolean` with the React 19 types. */
type InertValue = HTMLAttributes<HTMLElement> extends { inert?: infer Value } ? NonNullable<Value> : '';

/**
 * React 18 doesn't know `inert` and only renders the attribute from the string `''`. React 19 makes it a
 * boolean and drops `''` as false. The cast is the one place that bridges the two type versions.
 */
const inertValue = (Number(version.split('.')[0]) >= 19 ? true : '') as InertValue;

/**
 * Spread on an element to make it `inert` on both React 18 and React 19. Replace it with `inert={inert}`
 * once on React 19.
 */
export const inertProps = (inert: boolean | undefined): { inert?: InertValue } => (inert ? { inert: inertValue } : {});
