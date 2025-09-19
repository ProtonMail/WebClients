import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
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

const TopNavbarGetStartedButton = () => {
    const { state: renderGetStartedSpotlight, toggle: toggleGetStartedSpotlight } = useToggle(false);

    const { viewportWidth } = useActiveBreakpoint();

    const { anchorRef: b1Ref, isOpen: b1Open, toggle: b1Toggle, close: b1Close } = usePopperAnchor<any>();
    const { anchorRef: b2Ref, isOpen: b2Open, toggle: b2Toggle, close: b2Close } = usePopperAnchor<any>();

    const b3Click = () => {
        /* TODO add action */
    };
    const b4Click = () => {
        /* TODO add action */
    };

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
                        <span>{c('Info').t`Set up your organization and start protecting your data in a few easy steps.`}</span>

                        <Button onClick={b1Toggle} shape="ghost" color="weak">
                            <div className="flex flex-nowrap gap-x-2 items-center text-left">
                                <div className="shrink-0">
                                    <img src={profilesImg} alt="" />
                                </div>
                                <div>
                                    <b>{c('Info').t`Invite your team`}</b>
                                    <br />
                                    {c('Info')
                                        .t`Create new user accounts or import users with SSO (single sign-on) SCIM provisioning.`}
                                </div>
                                <Icon
                                    ref={b1Ref}
                                    name="three-dots-vertical"
                                    size={6}
                                    className="p-0.5 self-center shrink-0"
                                />
                            </div>
                        </Button>
                        <Dropdown isOpen={b1Open} anchorRef={b1Ref} onClose={b1Close} originalPlacement="bottom-end">
                            <DropdownMenu>
                                {(['alias', 'alias-slash'] as const).map((i) => {
                                    // TODO replace with actual actions
                                    return (
                                        <DropdownMenuButton className="text-left flex gap-2 items-center" key={i}>
                                            <Icon name={i} size={4} />
                                            {i}
                                        </DropdownMenuButton>
                                    );
                                })}
                            </DropdownMenu>
                        </Dropdown>

                        <Button onClick={b2Toggle} shape="ghost" color="weak">
                            <div className="flex flex-nowrap gap-x-2 text-left">
                                <div className="shrink-0">
                                    <img src={networkConfigurationImg} alt="" />
                                </div>
                                <div>
                                    <b>{c('Info').t`Configure your network`}</b>
                                    <br />
                                    {c('Info')
                                        .t`Create a Gateway to give your users access to your IT resources through dedicated servers.`}
                                </div>
                                <Icon
                                    ref={b2Ref}
                                    name="three-dots-vertical"
                                    size={6}
                                    className="p-0.5 self-center shrink-0"
                                />
                            </div>
                        </Button>
                        <Dropdown isOpen={b2Open} anchorRef={b2Ref} onClose={b2Close} originalPlacement="bottom-end">
                            <DropdownMenu>
                                {(['alias', 'alias-slash'] as const).map((i) => {
                                    // TODO replace with actual actions
                                    return (
                                        <DropdownMenuButton className="text-left flex gap-2 items-center" key={i}>
                                            <Icon name={i} size={4} />
                                            {i}
                                        </DropdownMenuButton>
                                    );
                                })}
                            </DropdownMenu>
                        </Dropdown>

                        <Button onClick={b3Click} shape="ghost" color="weak">
                            <div className="flex flex-nowrap gap-x-2 text-left">
                                <div className="shrink-0">
                                    <img src={globeVpnImg} alt="" />
                                </div>
                                <div>
                                    <b>{c('Info').t`Manage global VPN permissions`}</b>
                                    <br />
                                    {c('Info')
                                        .t`Decide which users can connect to each of our 120+ shared server locations.`}
                                </div>
                                <Icon name="chevron-right" size={6} className="self-center shrink-0" />
                            </div>
                        </Button>

                        <Button onClick={b4Click} shape="ghost" color="weak">
                            <div className="flex flex-nowrap gap-x-2 text-left">
                                <div className="shrink-0">
                                    <img src={recoveryImg} alt="" />
                                </div>
                                <div>
                                    <b>{c('Info').t`Secure your organization`}</b>
                                    <br />
                                    {c('Info')
                                        .t`If you haven’t already, enable some recovery methods to make sure you never lose access to ${VPN_APP_NAME}.`}
                                </div>
                                <Icon name="chevron-right" size={6} className="self-center shrink-0" />
                            </div>
                        </Button>
                    </>
                }
            >
                {/* TODO This should not be hard-coded */}
                <ButtonGroup>
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
