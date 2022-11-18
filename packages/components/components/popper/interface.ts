import type { Placement as FloatingUiPlacement } from '@floating-ui/dom';

export type ArrowOffset = 0 | string;

export type PopperPlacement = FloatingUiPlacement;

export type PopperPosition = { top: number; left: number };

export type PopperArrow = { '--arrow-offset': ArrowOffset };
