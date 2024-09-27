import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useAccountSpotlights } from '@proton/components';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';

import spotlightAddUsers from './spotlight-add-users.svg';
import spotlightVault from './spotlight-vault.svg';

interface SetupOrgSpotlightProps {
    children: ReactNode;
    app: APP_NAMES;
}

export const SetupOrgSpotlight = ({ children, app }: SetupOrgSpotlightProps) => {
    const {
        passOnboardingSpotlights: { setupOrgSpotlight },
    } = useAccountSpotlights();

    if (app !== APPS.PROTONPASS) {
        return children;
    }

    return (
        <Spotlight
            content={
                <div className="flex flex-nowrap">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightAddUsers} className="w-custom" style={{ '--w-custom': '4em' }} alt="" />
                    </div>
                    <span>
                        <div className="text-bold mb-1">
                            {c('Pass B2B onboarding spotlight').t`Set up your organization`}
                        </div>
                        <p className="m-0">
                            {c('Pass B2B onboarding spotlight')
                                .t`Start adding users to give them access to ${PASS_APP_NAME}.`}
                        </p>
                    </span>
                </div>
            }
            show={setupOrgSpotlight.isOpen}
            onClose={setupOrgSpotlight.close}
            originalPlacement="right"
            className="z-up"
        >
            {children}
        </Spotlight>
    );
};

interface StartUsingPassSpotlightProps {
    children: ReactNode;
    app: APP_NAMES;
}

export const StartUsingPassSpotlight = ({ children, app }: StartUsingPassSpotlightProps) => {
    const {
        passOnboardingSpotlights: { startUsingPassSpotlight },
    } = useAccountSpotlights();

    if (app !== APPS.PROTONPASS) {
        return children;
    }

    return (
        <Spotlight
            content={
                <div className="flex flex-nowrap">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightVault} className="w-custom" style={{ '--w-custom': '4em' }} alt="" />
                    </div>
                    <span>
                        <div className="text-bold mb-1">
                            {c('Pass B2B onboarding spotlight').t`Start using ${PASS_APP_NAME}`}
                        </div>
                        <p className="m-0">
                            {c('Pass B2B onboarding spotlight')
                                .t`Go to your vault to manage your passwords, aliases, and more.`}
                        </p>
                    </span>
                </div>
            }
            show={startUsingPassSpotlight.isOpen}
            onClose={startUsingPassSpotlight.close}
            originalPlacement="right"
            className="z-up"
        >
            {children}
        </Spotlight>
    );
};
