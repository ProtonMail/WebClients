import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import Icon from '@proton/components/components/icon/Icon';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import globeVpnImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe-vpn.svg';
import networkConfigurationImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-network-configuration.svg';
import profilesImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';
import recoveryImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-recovery.svg';

import { type DisplayItem, SpotlightMenuButton } from './SpotlightMenuButton';

const localStorageKey = 'b2b-get-started-enabled';

/** This endpoint returns `false` for a pristine account and `true` once the user has done any action */
async function getDidUserMakeAnyAction() {
    return new Promise((resolve) => {
        // TODO replace with real API call
        setTimeout(() => resolve(false), 500);
    });
}

export const TopNavbarGetStartedButton = () => {
    const [user] = useUser();
    const [organization] = useOrganization();

    const [shouldShowGetStartedButton, setShowGetStartedButton] = useState<true | null>(null);

    /* Show the button when:
     * - User is an org admin && subscribed to a b2b plan
     * - User did not hide the button manually
     * - User did not take any action yet (new user)
     */

    const canShowB2BButton = isAdmin(user) && getIsB2BAudienceFromPlan(organization?.PlanName);

    useEffect(() => {
        if (!canShowB2BButton) {
            return;
        }

        /* Show the get started button when a new user has not taken any action yet. */
        void getDidUserMakeAnyAction().then((didMake) => {
            if (!didMake) {
                localStorage.setItem(localStorageKey, 'true');
                setShowGetStartedButton(true);
            }
        });

        /* Show the get started button if it wasn't dismissed. */
        const enabled = JSON.parse(localStorage.getItem(localStorageKey) || 'false');
        if (enabled) {
            setShowGetStartedButton(true);
        }
    }, [canShowB2BButton]);

    const getStartedItems = useMemo(
        () =>
            [
                {
                    imgSrc: profilesImg,
                    imgAlt: c('Info:img-alt').t`Profile cards illustration`,
                    title: c('Info').t`Invite your team`,
                    description: c('Info')
                        .t`Create new user accounts or import users with SSO (single sign-on) SCIM provisioning.`,
                    type: 'dropdown',
                    dropdownLinks: [
                        { label: 'Add users manually', icon: 'users', href: '/users-addresses' },
                        { label: 'Set up SSO', icon: 'key', href: '/single-sign-on' },
                    ],
                },
                {
                    imgSrc: networkConfigurationImg,
                    imgAlt: c('Info:img-alt').t`Server with user-bubbles flying around`,
                    title: c('Info').t`Configure your network`,
                    description: c('Info')
                        .t`Create a Gateway to give your users access to your IT resources through dedicated servers.`,
                    type: 'link',
                    linkHref: '/gateways',
                },
                {
                    imgSrc: globeVpnImg,
                    imgAlt: c('Info:img-alt').t`Globe with data lines`,
                    title: c('Info').t`Manage global VPN permissions`,
                    description: c('Info')
                        .t`Decide which users can connect to each of our 120+ shared server locations.`,
                    type: 'link',
                    linkHref: '/shared-servers',
                },
                {
                    imgSrc: recoveryImg,
                    imgAlt: c('Info:img-alt').t`A lock with arrows`,
                    title: c('Info').t`Secure your organization`,
                    description: c('Info')
                        .t`If you haven’t already, enable some recovery methods to make sure you never lose access to ${VPN_APP_NAME}.`,
                    type: 'link',
                    linkHref: '/authentication-security',
                },
            ] as const satisfies DisplayItem[],
        []
    );

    if (!canShowB2BButton) {
        return null;
    }

    return (
        shouldShowGetStartedButton && (
            <SpotlightMenuButton
                initiallyOpen
                buttonIcon={<Icon name="buildings" />}
                buttonText={c('Title').t`Get started`}
                items={getStartedItems}
                header={
                    <>
                        <h3 className="text-bold">{c('Info').t`Get started`}</h3>
                        <span>{c('Info')
                            .t`Set up your organization and start protecting your data in a few easy steps.`}</span>
                    </>
                }
                onDismiss={() => {
                    /* TODO send user event to api */
                    localStorage.removeItem(localStorageKey);
                    setShowGetStartedButton(null);
                }}
                dismissTitle={c('Title').t`Dismiss setup checklist`}
            />
        )
    );
};
