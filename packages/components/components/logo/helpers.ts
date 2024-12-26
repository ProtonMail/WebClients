import type { CSSProperties } from 'react';

// to size something in rem
export const getLogoWidthRem = (width: number) => width / 16;
export const getLogoWidthStyles = (width: number): CSSProperties => ({ inlineSize: `${getLogoWidthRem(width)}rem` });
