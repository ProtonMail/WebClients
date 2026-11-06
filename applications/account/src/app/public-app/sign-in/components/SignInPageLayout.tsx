import type { ReactNode } from 'react';

import Content from '../../layout/Content';
import Header from '../../layout/Header';
import Layout from '../../layout/Layout';
import Main from '../../layout/Main';
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
