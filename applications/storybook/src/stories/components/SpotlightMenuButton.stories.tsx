import { useMemo, useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import type { DisplayItem } from '@proton/components/components/topnavbar/SpotlightMenuButton';
import { SpotlightMenuButton } from '@proton/components/components/topnavbar/SpotlightMenuButton';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import globeVpnImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe-vpn.svg';
import networkConfigurationImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-network-configuration.svg';
import profilesImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';
import recoveryImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-recovery.svg';

const meta: Meta<typeof SpotlightMenuButton> = {
    title: 'Components/SpotlightMenuButton',
    component: SpotlightMenuButton,
    parameters: {
        docs: {
            description: {
                component:
                    'A top navigation button that opens a spotlight menu with onboarding/checklist items. Supports dropdown links, external links, headers, footers, and a dismiss action.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SpotlightMenuButton>;

export const Default: Story = {
    render: () => {
        const [show, setShow] = useState<true | null>(true);

        const items = useMemo(
            () =>
                [
                    {
                        imgSrc: profilesImg,
                        title: c('Info').t`Invite your team`,
                        description: c('Info')
                            .t`Create new user accounts or import users with SSO (single sign-on) SCIM provisioning.`,
                        type: 'dropdown',
                        dropdownLinks: [
                            { label: 'Add users manually', icon: 'users', href: '#/users-addresses' },
                            { label: 'Set up SSO', icon: 'key', href: '#/single-sign-on' },
                        ],
                    },
                    {
                        imgSrc: networkConfigurationImg,
                        title: c('Info').t`Configure your network`,
                        description: c('Info')
                            .t`Create a Gateway to give your users access to your IT resources through dedicated servers.`,
                        type: 'link',
                        linkHref: '#/gateways',
                    },
                    {
                        imgSrc: globeVpnImg,
                        title: c('Info').t`Manage global VPN permissions`,
                        description: c('Info')
                            .t`Decide which users can connect to each of our 120+ shared server locations.`,
                        type: 'link',
                        linkHref: '#/shared-servers',
                    },
                    {
                        imgSrc: recoveryImg,
                        title: c('Info').t`Secure your organization`,
                        description: c('Info')
                            .t`If you haven't already, enable some recovery methods to make sure you never lose access to ${VPN_APP_NAME}.`,
                        type: 'link',
                        linkHref: '#/authentication-security',
                    },
                ] as const satisfies DisplayItem[],
            []
        );

        return (
            <div className="p-7">
                <div className="flex flex-1 items-center justify-center border">
                    {show && (
                        <SpotlightMenuButton
                            initiallyOpen
                            buttonIcon={<Icon name="buildings" />}
                            buttonText={c('Title').t`Get started`}
                            items={items}
                            header={
                                <>
                                    <h3 className="text-bold">{c('Info').t`Get started`}</h3>
                                    <span>
                                        {c('Info')
                                            .t`Set up your organization and start protecting your data in a few easy steps.`}
                                    </span>
                                </>
                            }
                            onDismiss={() => setShow(null)}
                            dismissTitle={c('Title').t`Dismiss setup checklist`}
                        />
                    )}
                </div>
            </div>
        );
    },
};
