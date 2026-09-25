import Content from '../../public/Content';
import Header from '../../public/Header';
import Layout from '../../public/Layout';
import Main from '../../public/Main';
import type { SignInLayoutProps } from './SignInLayout';

/** The Pass desktop app's compact page. */
export const SignInPassDesktopLayout = ({
    title,
    subTitle,
    onBack,
    beforeMain,
    toApp,
    children,
}: SignInLayoutProps) => (
    <Layout toApp={toApp}>
        {beforeMain}
        <Main>
            <Header onBack={onBack} title={title} subTitle={subTitle} />
            <Content>{children}</Content>
        </Main>
    </Layout>
);
