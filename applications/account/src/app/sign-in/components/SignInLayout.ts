import type { ComponentType, ReactElement, ReactNode } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';

export interface SignInLayoutProps {
    title: ReactNode;
    subTitle?: string | ReactElement;
    onBack?: () => void;
    beforeMain?: ReactNode;
    toApp: APP_NAMES | undefined;
    /** The first step shows the page's decoration; later steps don't. */
    hasDecoration: boolean;
    children: ReactNode;
}

/** Frames each sign-in step. Pass one to `SignInContainer` to render the flow somewhere else, like a modal. */
export type SignInLayout = ComponentType<SignInLayoutProps>;
