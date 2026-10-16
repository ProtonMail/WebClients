import type { FC, PropsWithChildren } from 'react';

import type { LayoutProps } from '@proton/pass/components/Onboarding/Layout/Layout';
import { Layout as OnboardingLayout } from '@proton/pass/components/Onboarding/Layout/Layout';

import { Footer } from './Footer';

export const Layout: FC<PropsWithChildren<LayoutProps>> = (props) => {
    return <OnboardingLayout {...props} footer={<Footer />} />;
};
