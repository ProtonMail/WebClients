import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { ForkSearchParameters } from '@proton/shared/lib/authentication/fork/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import signOutDevicesImg from '@proton/styles/assets/img/illustrations/sign-out-devices.svg';

import { SupportedActions } from '../../lite-app/helper';
import { purifyMessage } from '../components/purifyMessage';
import Content from '../layout/Content';
import Layout from '../layout/Layout';
import Main from '../layout/Main';
import Text from '../layout/Text';

export type SessionLimitState = {
    app: APP_NAMES;
    errorMessage: string;
    localID: number;
    canPay: boolean;
};

// The plan selector of the lite app, on the session the user just signed in with
const getUpgradeUrl = (localID: number) => {
    const searchParams = new URLSearchParams({
        action: SupportedActions.SubscribeAccount,
        [ForkSearchParameters.LocalID]: `${localID}`,
    });
    return `/lite?${searchParams.toString()}`;
};

const SessionLimit = ({ state }: { state: SessionLimitState }) => {
    const { app, errorMessage, localID, canPay } = state;

    return (
        <Layout toApp={app} hasDecoration={false}>
            <Main>
                <Content className="text-center">
                    <div className="text-center my-8">
                        <img className="m-auto" src={signOutDevicesImg} width="172" height="124" alt="" />
                    </div>
                    <h1 className="h3 text-bold mb-0 mt-2 md:mt-0">{c('Title').t`Session limit reached`}</h1>
                    <Text margin="small" className="mt-4">
                        {/* The API message ends with a link to sign out on all devices, shown as the main action */}
                        {purifyMessage(errorMessage, {
                            linkClassName: 'button button-large button-solid-norm block w-full text-center mt-6',
                        })}
                    </Text>
                    {canPay && (
                        <ButtonLike as="a" href={getUpgradeUrl(localID)} size="large" fullWidth>
                            {c('Action').t`Upgrade to 2 devices or more`}
                        </ButtonLike>
                    )}
                </Content>
            </Main>
        </Layout>
    );
};

export default SessionLimit;
