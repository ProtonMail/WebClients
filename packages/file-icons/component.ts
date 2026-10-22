import type { ComponentType } from 'react';

import type { IconComponentProps } from '@proton/icons/component';
import type { IconSize } from '@proton/icons/types';

/** The props every generated `Mime*` component accepts: the same as the `Ic*` components from `@proton/icons`. */
export type MimeIconComponentProps = IconComponentProps;

/** A generated `Mime*` file icon component. */
export type MimeIconComponent = ComponentType<MimeIconComponentProps>;

/** File icons come in three shapes, each drawn for its own viewBox, so each size range gets the one that fits. */
export const getMimeIconAsset = (size: IconSize) => {
    if (size < 5) {
        return 'sm';
    }
    if (size < 10) {
        return 'md';
    }
    return 'lg';
};

export const MIME_ICON_VIEWBOX = {
    sm: '0 0 16 16',
    md: '0 0 24 24',
    lg: '0 0 48 48',
} as const;
