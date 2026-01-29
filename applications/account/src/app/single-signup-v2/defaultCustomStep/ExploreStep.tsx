import { c } from 'ttag';

import type { PLANS } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { OrganizationExtended, User } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

import ExploreAppsListV2, { getExploreApps } from '../../components/ExploreAppsListV2/ExploreAppsListV2';

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
        <div>
            <header className="mt-6 mb-8 md:mb-10 lg:mb-20 text-center fade-in">
                <h1 className="text-2xl md:text-6xl text-semibold mb-2">{c('Action').t`Welcome`}</h1>
                <p className="m-0 md:text-lg color-weak">{c('Info').t`Privacy and security starts here`}</p>
            </header>
            <div>
                <ExploreAppsListV2
                    subscription={{ subscribed, plan }}
                    apps={getExploreApps({
                        user,
                        organization,
                        isDocsHomepageAvailable,
                        isSheetsAvailable,
                        oauth: false,
                        isMeetAvailable,
                        isAuthenticatorAvailable,
                    })}
                    onExplore={onExplore}
                />
            </div>
        </div>
    );
};

export default ExploreStep;
