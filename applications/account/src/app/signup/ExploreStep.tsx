import { useEffect } from 'react';

import { c } from 'ttag';

import { useConfig } from '@proton/components';
import metrics from '@proton/metrics';
import { APP_NAMES, BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import ExploreAppsList, { getExploreApps } from './ExploreAppsList';
import { getSignupApplication } from './helper';

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
    user?: User;
    plan?: PLANS;
}

const ExploreStep = ({ onExplore, user, plan }: Props) => {
    const { APP_NAME } = useConfig();

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
                    apps={getExploreApps({ subscribed, user })}
                    onExplore={onExplore}
                />
            </Content>
        </Main>
    );
};

export default ExploreStep;
