import { ACTIVE_BREAKPOINTS } from '../constants';

const { DESKTOP, TABLET, MOBILE } = ACTIVE_BREAKPOINTS;

export const isMobile = (breakpoint: string): boolean => breakpoint === MOBILE;
export const isTablet = (breakpoint: string): boolean => breakpoint === TABLET;
export const isDesktop = (breakpoint: string): boolean => breakpoint === DESKTOP;
