import type { ReactNode } from 'react';

import Content from '../../layout/Content';
import Header from '../../layout/Header';
import Layout from '../../layout/Layout';
import Main from '../../layout/Main';
import { ScrollToTop } from './ScrollToTop';
import type { SignInLayout, SignInLayoutProps } from './SignInLayout';

/** The Pass desktop app's compact page. */
export const SignInPassDesktopLayout: SignInLayout = {
    Shell: function SignInPassDesktopShell({ beforeMain, toApp, children }: SignInLayoutProps) {
        return (
            <Layout toApp={toApp}>
                {beforeMain}
                <Main>{children}</Main>
            </Layout>
        );
    },
    Header,
    Body: function SignInPassDesktopBody({ children }: { children: ReactNode }) {
        return (
            <Content>
                <ScrollToTop />
                {children}
            </Content>
        );
    },
};
