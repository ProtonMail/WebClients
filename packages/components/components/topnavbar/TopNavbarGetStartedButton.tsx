import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { IcBuildings } from '@proton/icons/icons/IcBuildings';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import globeVpnImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe-vpn.svg';
import networkConfigurationImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-network-configuration.svg';
import profilesImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';
import recoveryImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-recovery.svg';

import { type DisplayItem, SpotlightMenuButton } from './SpotlightMenuButton';

const localStorageKey = 'b2b-get-started-state';

enum GetStartedStatus {
    Dismissed = '0',
    Enabled = '1',
}

/** This endpoint returns `false` for a pristine account and `true` once the user has done any action. */
async function getDidUserMakeAnyAction() {
    return new Promise((resolve) => {
        // TODO replace with real API call
        setTimeout(() => resolve(true), 500);
    });
}

function recordAction() {
    // TODO replace with real API call to record the user's action on the server.
}

export const TopNavbarGetStartedButton = () => {
    const [user] = useUser();
    const [organization] = useOrganization();

    const [shouldShowGetStartedButton, setShowGetStartedButton] = useState<true | null>(null);

    /** Show the button when:
     * - User is an org admin && subscribed to a b2b plan
     * - User did not hide the button manually
     * - User did not take any action yet (new user)
     */
    const canShowB2BButton = isAdmin(user) && getIsB2BAudienceFromPlan(organization?.PlanName);

    useEffect(() => {
        if (!canShowB2BButton) {
            return;
        }

        const localStatus = getItem<GetStartedStatus>(localStorageKey);
        switch (localStatus) {
            /* Show the get started button as it was enabled previously. */
            case GetStartedStatus.Enabled:
                setShowGetStartedButton(true);
                break;
            /* The user dismissed the button manually. */
            case GetStartedStatus.Dismissed:
                setShowGetStartedButton(null);
                break;
            /* This is a fresh browser (no localstorage), let's ask the API if the user is a new user and has not taken any action yet. */
            default:
                void getDidUserMakeAnyAction().then((didMake) => {
                    if (!didMake) {
                        setItem(localStorageKey, GetStartedStatus.Enabled);
                        setShowGetStartedButton(true);
                    }
                });
        }
    }, [canShowB2BButton]);

    const getStartedItems = useMemo(
        () =>
            [
                {
                    imgSrc: profilesImg,
                    title: c('Button').t`Invite your team`,
                    description: c('Description')
                        .t`Create new user accounts or import users with SSO (single sign-on) SCIM provisioning.`,
                    type: 'dropdown',
                    dropdownLinks: [
                        { label: c('Button').t`Add users manually`, icon: 'users', href: '/users-addresses' },
                        { label: c('Button').t`Set up SSO`, icon: 'key', href: '/single-sign-on' },
                    ],
                },
                {
                    imgSrc: networkConfigurationImg,
                    title: c('Button').t`Configure your network`,
                    description: c('Description')
                        .t`Create a Gateway to give your users access to your IT resources through dedicated servers.`,
                    type: 'link',
                    linkHref: '/gateways',
                },
                {
                    imgSrc: globeVpnImg,
                    title: c('Button').t`Manage global VPN permissions`,
                    description: c('Description')
                        .t`Decide which users can connect to each of our 120+ shared server locations.`,
                    type: 'link',
                    linkHref: '/shared-servers',
                },
                {
                    imgSrc: recoveryImg,
                    title: c('Button').t`Secure your organization`,
                    description: c('Description')
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
                buttonIcon={<IcBuildings/>}
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
                    setItem(localStorageKey, GetStartedStatus.Dismissed);
                    setShowGetStartedButton(null);
                    recordAction();
                }}
                dismissTitle={c('Title').t`Dismiss setup checklist`}
            />
        )
    );
};
