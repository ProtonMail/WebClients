import Content from '../../public/Content';
import Header from '../../public/Header';
import Layout from '../../public/Layout';
import Main from '../../public/Main';
import TroubleshootWithLumo from '../../public/TroubleshootWithLumo';
import type { SignInLayoutProps } from './SignInLayout';

/** The sign-in page. */
export const SignInPageLayout = ({
    title,
    subTitle,
    onBack,
    beforeMain,
    toApp,
    hasDecoration,
    children,
}: SignInLayoutProps) => (
    <Layout
        toApp={toApp}
        hasWelcome
        onBack={onBack}
        hasDecoration={hasDecoration}
        bottomRight={<TroubleshootWithLumo />}
    >
        {beforeMain}
        <Main>
            <Header onBack={onBack} title={title} subTitle={subTitle} />
            <Content>{children}</Content>
        </Main>
    </Layout>
);
