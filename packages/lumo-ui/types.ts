import type { ComponentType } from 'react';

import type { IconSize } from '@proton/icons/types';

/** A `@proton/icons` glyph a product supplies to a Lumo UI element. */
export type IconComponent = ComponentType<{ className?: string; size?: IconSize }>;
