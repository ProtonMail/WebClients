import type { ReactNode } from 'react';

import { AuthStep } from '@proton/components/containers/login/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Content from '../public/Content';
import Header from '../public/Header';
import Layout from '../public/Layout';
import Main from '../public/Main';
import PublicHelpLink from '../public/PublicHelpLink';

export interface RenderProps {
    title: string;
    subTitle?: string;
    onBack?: () => void;
    content: ReactNode;
    toApp?: APP_NAMES;
    step: AuthStep;
}

export type Render = (renderProps: RenderProps) => ReactNode;

export const defaultElectronPassLoginRender = (data: RenderProps) => {
    return (
        <Layout toApp={data.toApp}>
            <Main>
                <Header onBack={data.onBack} title={data.title} subTitle={data.subTitle} />
                <Content>{data.content}</Content>
            </Main>
        </Layout>
    );
};

export const defaultLoginRender = (data: RenderProps) => {
    return (
        <Layout
            toApp={data.toApp}
            hasWelcome
            onBack={data.onBack}
            hasDecoration={data.step === AuthStep.LOGIN}
            bottomRight={<PublicHelpLink />}
        >
            <Main>
                <Header onBack={data.onBack} title={data.title} subTitle={data.subTitle} />
                <Content>{data.content}</Content>
            </Main>
        </Layout>
    );
};
