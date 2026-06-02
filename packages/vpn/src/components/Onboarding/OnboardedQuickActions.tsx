import { useMemo } from 'react';

import { c } from 'ttag';

import { type DisplayItem, SpotlightMenuButton } from '@proton/components/components/topnavbar/SpotlightMenuButton';
import { useLocalState } from '@proton/components/index';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import globeVpnImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe-vpn.svg';
import networkConfigurationImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-network-configuration.svg';
import profilesImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';
import recoveryImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-recovery.svg';

import { Onboarding } from '../../../constants/onboarding';

type Props = {
    onDismiss: () => void;
};

export const OnboardedQuickActions = ({ onDismiss }: Props) => {
    const getStartedItems = useMemo(
        (): DisplayItem[] => [
            {
                imgSrc: profilesImg,
                title: c('Button').t`Invite your team`,
                description: c('Description')
                    .t`Create new user accounts or import users with SSO (single sign-on) SCIM provisioning.`,
                type: 'dropdown',
                dropdownLinks: [
                    {
                        label: c('Button').t`Add users manually`,
                        icon: 'users',
                        href: '/users-addresses',
                    },
                    {
                        label: c('Button').t`Set up SSO`,
                        icon: 'key',
                        href: '/single-sign-on',
                    },
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
                linkHref: '/recovery',
            },
        ],
        []
    );

    const [isFresh, setIsFresh] = useLocalState<boolean>(true, Onboarding.quickActionsKey);

    const handleOnDismiss = () => {
        if (isFresh) {
            setIsFresh(false);
        }
        onDismiss();
    };

    return (
        <SpotlightMenuButton
            initiallyOpen={isFresh}
            items={getStartedItems}
            onToggle={setIsFresh}
            header={
                <div className="pb-4">
                    <h3 className="text-bold">{c('Info').t`Get started`}</h3>
                    <div className="color-weak pt-1">{c('Info')
                        .t`Set up your organization and start protecting your data in a few easy steps.`}</div>
                </div>
            }
            onDismiss={handleOnDismiss}
        />
    );
};
