import { c } from 'ttag';

import type { PLANS } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { OrganizationExtended, User } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import ExploreAppsList, { getExploreApps } from '../../components/ExploreAppsList';
import Content from '../../public/Content';
import Header from '../../public/Header';
import Main from '../../public/Main';

interface Props {
    onExplore: (app: APP_NAMES) => Promise<void>;
    user?: User;
    organization?: OrganizationExtended;
    plan?: PLANS;
}

const ExploreStep = ({ onExplore, user, organization, plan }: Props) => {
    const isDocsHomepageAvailable = useFlag('DriveDocsLandingPageEnabled');
    const isSheetsAvailable = useFlag('DocsSheetsEnabled');
    const isMeetAvailable = useFlag('PMVC2025');
    const isAuthenticatorAvailable = useFlag('AuthenticatorSettingsEnabled');

    const subscribed = user?.Subscribed || 0;

    return (
        <Main>
            <Header title={c('new_plans: title').t`Start exploring the ${BRAND_NAME} universe`} />
            <Content>
                <ExploreAppsList
                    subscription={{ subscribed, plan }}
                    apps={getExploreApps({
                        subscribed,
                        user,
                        organization,
                        isDocsHomepageAvailable,
                        isSheetsAvailable,
                        isMeetAvailable,
                        isAuthenticatorAvailable,
                    })}
                    onExplore={onExplore}
                />
            </Content>
        </Main>
    );
};

export default ExploreStep;
