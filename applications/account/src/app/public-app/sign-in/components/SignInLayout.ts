import type { ComponentType, ReactElement, ReactNode } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';

export interface SignInLayoutProps {
    onBack?: () => void;
    beforeMain?: ReactNode;
    /** For the page's bottom-right corner, like the Lumo launcher; layouts without one leave it out. */
    bottomRight?: ReactNode;
    toApp: APP_NAMES | undefined;
    /** The first step shows the page's decoration; later steps don't. */
    hasDecoration: boolean;
    children: ReactNode;
}

/**
 * A screen's heading, as the layout shows it, where its title goes. A screen without a subtitle, or with a heading of
 * its own, leaves it out.
 */
export interface SignInLayoutHeaderProps {
    title?: ReactNode;
    subTitle?: string | ReactElement;
    /** Required, even when the page offers no back (`undefined`): every screen passes the page's. */
    onBack: (() => void) | undefined;
}

/**
 * Where the sign-in renders: the `Shell` that stays mounted around its screens (the page's decoration, back, corner),
 * and what each screen is built from, shown the layout's way: its heading (`Header`), then a `Body` for the rest. Pass
 * one to `SignInContainer` to render the flow somewhere else, like a modal.
 */
export type SignInLayout = {
    Shell: ComponentType<SignInLayoutProps>;
    Header: ComponentType<SignInLayoutHeaderProps>;
    Body: ComponentType<{ children: ReactNode }>;
};
