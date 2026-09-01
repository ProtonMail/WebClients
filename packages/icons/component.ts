import type { ComponentType, SVGProps } from 'react';

import type { IconSize } from './types';

/**
 * The props every generated `Ic*` component accepts.
 *
 * Kept by hand rather than in `types.ts`, which is generated.
 */
export interface IconComponentProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    /** If specified, renders an sr-only element for screenreaders */
    alt?: string;
    /** If specified, renders an inline title element */
    title?: string;
    size?: IconSize;
}

/**
 * A generated `Ic*` icon component.
 *
 * Use this where an icon has to be passed as a component rather than as an
 * element — a `.ts` module that cannot build JSX, or a slot whose size or
 * inline style is decided by the render site rather than the caller.
 * Everywhere else, prefer passing a `ReactNode`.
 */
export type IconComponent = ComponentType<IconComponentProps>;
