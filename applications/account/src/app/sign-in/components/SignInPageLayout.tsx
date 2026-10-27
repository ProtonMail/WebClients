import type { ReactNode } from 'react';

import Content from '../../public/Content';
import Header from '../../public/Header';
import Layout from '../../public/Layout';
import Main from '../../public/Main';
import { ScrollToTop } from './ScrollToTop';
import type { SignInLayout, SignInLayoutProps } from './SignInLayout';

/** The sign-in page. */
export const SignInPageLayout: SignInLayout = {
    Shell: function SignInPageShell({
        onBack,
        beforeMain,
        bottomRight,
        toApp,
        hasDecoration,
        children,
    }: SignInLayoutProps) {
        return (
            <Layout toApp={toApp} hasWelcome onBack={onBack} hasDecoration={hasDecoration} bottomRight={bottomRight}>
                {beforeMain}
                <Main>{children}</Main>
            </Layout>
        );
    },
    Header,
    Body: function SignInPageBody({ children }: { children: ReactNode }) {
        return (
            <Content>
                <ScrollToTop />
                {children}
            </Content>
        );
    },
};
