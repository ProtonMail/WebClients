import { useCallback, useMemo } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import AppLink from '@proton/components/components/link/AppLink';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import TopNavbarListItemButton from '@proton/components/components/topnavbar/TopNavbarListItemButton';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useToggle from '@proton/components/hooks/useToggle';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import globeVpnImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-globe-vpn.svg';
import networkConfigurationImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-network-configuration.svg';
import profilesImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-profiles.svg';
import recoveryImg from '@proton/styles/assets/img/onboarding/b2b/img-b2b-recovery.svg';
import clsx from '@proton/utils/clsx';

import ButtonGroup from '../button/ButtonGroup';
import Dropdown from '../dropdown/Dropdown';
import DropdownMenu from '../dropdown/DropdownMenu';
import DropdownMenuButton from '../dropdown/DropdownMenuButton';
import usePopperAnchor from '../popper/usePopperAnchor';

interface DisplayItem {
    img: string;
    imgAlt?: string;
    title: string;
    description: string;
    type: 'dropdown' | 'link';
    dropdownLinks?: { label: string; icon: IconName; href: string }[];
    linkHref?: string;
}

const displayItems = [
    {
        img: profilesImg,
        imgAlt: c('Info:img-alt').t`Profile cards illustration`,
        title: c('Info').t`Invite your team`,
        description: c('Info').t`Create new user accounts or import users with SSO (single sign-on) SCIM provisioning.`,
        type: 'dropdown',
        dropdownLinks: [
            // TODO get the routes from a constant like -> somehow? // import { getOrganizationAppRoutes } from '../../../../applications/account/src/app/containers/organization/routes';
            { label: 'Add users manually', icon: 'users', href: '/users-addresses' },
            { label: 'Set up SSO', icon: 'key', href: '/single-sign-on' },
        ],
    },
    {
        img: networkConfigurationImg,
        imgAlt: c('Info:img-alt').t`Server with user-bubbles flying around`,
        title: c('Info').t`Configure your network`,
        description: c('Info')
            .t`Create a Gateway to give your users access to your IT resources through dedicated servers.`,
        type: 'link',
        linkHref: '/gateways',
    },
    {
        img: globeVpnImg,
        imgAlt: c('Info:img-alt').t`Globe with data lines`,
        title: c('Info').t`Manage global VPN permissions`,
        description: c('Info').t`Decide which users can connect to each of our 120+ shared server locations.`, // TODO this 120+ should be dynamic?
        type: 'link',
        linkHref: '/shared-servers',
    },
    {
        img: recoveryImg,
        imgAlt: c('Info:img-alt').t`A lock with arrows`,
        title: c('Info').t`Secure your organization`,
        description: c('Info')
            .t`If you haven’t already, enable some recovery methods to make sure you never lose access to ${VPN_APP_NAME}.`,
        type: 'link',
        linkHref: '/authentication-security',
    },
] as const satisfies DisplayItem[];

const TopNavbarGetStartedButton = () => {
    const {
        state: renderGetStartedSpotlight,
        toggle: toggleGetStartedSpotlight,
        set: setGetStartedSpotlight,
    } = useToggle(false);
    const closeGetStartedSpotlight = useCallback(() => {
        setGetStartedSpotlight(false);
    }, []);

    const { viewportWidth } = useActiveBreakpoint();

    const b1Dropdown = usePopperAnchor<HTMLElement>();

    /**
     * Provide refs and actions for dropdown menu items.
     * Use the usePopperAnchor hook to get the anchorRef, toggle, close, and isOpen.
     * This array must match the order of menuItems.
     */
    const actionsRefsObject = useMemo(() => [b1Dropdown, null, null, null], [b1Dropdown]);

    return (
        <>
            <Spotlight
                originalPlacement="bottom-end"
                closeIcon="cross-big"
                show={renderGetStartedSpotlight}
                onClose={toggleGetStartedSpotlight}
                size="large"
                className="w-full"
                innerClassName="px-5 pt-6"
                style={{ maxInlineSize: '600px' }}
                content={
                    <>
                        <h3 className="text-bold">{c('Info').t`Get started`}</h3>
                        <span>{c('Info')
                            .t`Set up your organization and start protecting your data in a few easy steps.`}</span>

                        {displayItems.map((item, index) => {
                            if (item.type === 'dropdown') {
                                const { anchorRef, toggle, close, isOpen } = actionsRefsObject[index] as ReturnType<
                                    typeof usePopperAnchor<HTMLElement>
                                >;
                                return (
                                    <>
                                        <Button onClick={toggle} shape="ghost" color="weak">
                                            <div className="flex flex-nowrap gap-x-2 items-center text-left">
                                                <div className="shrink-0">
                                                    <img src={item.img} alt={item.imgAlt} />
                                                </div>
                                                <div>
                                                    <b>{item.title}</b>
                                                    <br />
                                                    {item.description}
                                                </div>
                                                <Icon
                                                    ref={anchorRef as any}
                                                    name="three-dots-vertical"
                                                    size={6}
                                                    className="p-0.5 self-center shrink-0"
                                                />
                                            </div>
                                        </Button>
                                        <Dropdown
                                            isOpen={isOpen}
                                            anchorRef={anchorRef}
                                            onClose={close}
                                            originalPlacement="bottom-end"
                                        >
                                            <DropdownMenu>
                                                {item.dropdownLinks?.map(({ label, icon, href }) => {
                                                    return (
                                                        <AppLink
                                                            to={href}
                                                            className="text-no-decoration"
                                                            onClick={closeGetStartedSpotlight}
                                                        >
                                                            <DropdownMenuButton
                                                                className="text-left flex gap-2 items-center"
                                                                key={label}
                                                            >
                                                                <Icon name={icon} size={4} />
                                                                {label}
                                                            </DropdownMenuButton>
                                                        </AppLink>
                                                    );
                                                })}
                                            </DropdownMenu>
                                        </Dropdown>
                                    </>
                                );
                            }
                            return (
                                <ButtonLike
                                    as={AppLink}
                                    to={item.linkHref!}
                                    onClick={closeGetStartedSpotlight}
                                    shape="ghost"
                                    color="weak"
                                >
                                    <div className="flex flex-nowrap gap-x-2 text-left">
                                        <div className="shrink-0">
                                            <img src={item.img} alt={item.imgAlt} />
                                        </div>
                                        <div>
                                            <b>{item.title}</b>
                                            <br />
                                            {item.description}
                                        </div>
                                        <Icon name="chevron-right" size={6} className="self-center shrink-0" />
                                    </div>
                                </ButtonLike>
                            );
                        })}
                    </>
                }
            >
                {/* TODO This should not be hard-coded - What are the conditions? */}
                <ButtonGroup className="mx-3">
                    <TopNavbarListItemButton
                        as="button"
                        shape="outline"
                        color="weak"
                        type="button"
                        title={c('Title').t`Get started`}
                        className={clsx('topnav-org-setup', viewportWidth['<=medium'] && 'button-for-icon')}
                        onClick={toggleGetStartedSpotlight}
                        icon={<Icon name="buildings" />}
                        text={c('Title').t`Get started`}
                        aria-label={c('Title').t`Organization setup`}
                    />
                    <TopNavbarListItemButton
                        as="button"
                        shape="outline"
                        color="weak"
                        type="button"
                        title={c('Title').t`Dismiss setup checklist`}
                        className={clsx(viewportWidth['<=medium'] && 'button-for-icon')}
                        onClick={() => {
                            /* TODO add action */ console.log('Dismiss clicked');
                        }}
                        icon={<Icon name="cross" style={{ margin: 0 }} />}
                        aria-label={c('Title').t`Organization setup`}
                    />
                </ButtonGroup>
            </Spotlight>
        </>
    );
};

export default TopNavbarGetStartedButton;
