import { type ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { getApplicationNameWithPlatform } from '@proton/shared/lib/apps/getApplicationNameWithPlatform';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';

import successImg from '../../app/containers/securityCheckup/assets/method-success.svg';
import type { ProduceDesktopForkParameters } from '../content/actions/desktopForkInterface';
import Content from './Content';
import Layout from './Layout';
import Main from './Main';
import Text from './Text';

export type AuthDesktopState = {
    app: APP_NAMES;
    desktopForkParameters: ProduceDesktopForkParameters;
    result: { type: 'success' } | { type: 'error'; errorMessage: string };
};

const View = ({ image, title, children }: { image: string; title: string; children: ReactNode }) => {
    return (
        <Content className="text-center">
            <div className="text-center my-8">
                <img className="m-auto w-custom" style={{ '--w-custom': '9.375rem' }} src={image} alt="" />
            </div>
            <h1 className="h3 text-bold mb-0 mt-2 md:mt-0">{title}</h1>
            {children}
        </Content>
    );
};

const AuthDesktop = ({ state }: { state: AuthDesktopState }) => {
    const { app, desktopForkParameters, result } = state;

    const applicationName = getApplicationNameWithPlatform(
        getAppName(app),
        desktopForkParameters.qrCodePayload.childClientId
    );
    const redirectUrl = desktopForkParameters.redirectUrl;

    useEffect(() => {
        if (redirectUrl) {
            // This attempts to do an automatic redirect, but some browsers don't allow it and require
            // a user interaction. Because of that there is a clickable link as well.
            replaceUrl(redirectUrl);
        }
    }, []);

    return (
        <Layout toApp={app} hasDecoration={false}>
            <Main>
                {(() => {
                    if (result.type === 'success') {
                        return (
                            <View image={successImg} title={c('Title').t`You've successfully signed in!`}>
                                <Text className="mt-4">
                                    {getBoldFormattedText(c('Info').t`You may now start using **${applicationName}**`)}
                                </Text>
                                {redirectUrl && (
                                    <ButtonLike as="a" href={redirectUrl}>
                                        {c('Action').t`Open ${applicationName}`}
                                    </ButtonLike>
                                )}
                            </View>
                        );
                    }

                    const errorMessage = result.errorMessage;
                    return (
                        <View image={errorImg} title={c('Error message').t`Oops, something went wrong`}>
                            <Text className="mt-4">
                                {getBoldFormattedText(
                                    c('Info').t`An error occurred while communicating with **${applicationName}**`
                                )}
                            </Text>
                            {errorMessage && (
                                <div className="text-weak text-sm mt-4">
                                    {c('Error message').t`Error: ${errorMessage}`}
                                </div>
                            )}
                        </View>
                    );
                })()}
            </Main>
        </Layout>
    );
};

export default AuthDesktop;
