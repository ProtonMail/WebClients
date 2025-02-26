import { useEffect } from 'react';

import { c } from 'ttag';

import useConfig from '@proton/components/hooks/useConfig';
import metrics from '@proton/metrics';
import { type PLANS } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { OrganizationWithSettings, User } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import ExploreAppsList, { getExploreApps } from './ExploreAppsList';
import { getSignupApplication } from './helper';

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
    user?: User;
    organization?: OrganizationWithSettings;
    plan?: PLANS;
}

const ExploreStep = ({ onExplore, user, organization, plan }: Props) => {
    const { APP_NAME } = useConfig();

    const isLumoAvailable = useFlag('LumoInProductSwitcher');
    const isAccessControlEnabled = useFlag('AccessControl');

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'recovery',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    const subscribed = user?.Subscribed || 0;

    return (
        <Main>
            <Header title={c('new_plans: title').t`Start exploring the ${BRAND_NAME} universe`} />
            <Content>
                <ExploreAppsList
                    subscription={{ subscribed, plan }}
                    apps={getExploreApps({ subscribed, user, organization, isLumoAvailable, isAccessControlEnabled })}
                    onExplore={onExplore}
                />
            </Content>
        </Main>
    );
};

export default ExploreStep;
