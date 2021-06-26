import React from 'react';
import { c } from 'ttag';
import { APPS, BRAND_NAME, APP_NAMES } from '@proton/shared/lib/constants';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';

import { Icon, DropdownMenu, DropdownMenuButton, DropdownMenuLink } from '../../components';
import { useModals, useAuthentication, useConfig } from '../../hooks';
import BugModal from '../support/BugModal';
import AuthenticatedBugModal from '../support/AuthenticatedBugModal';
import { OnboardingModal } from '../onboarding';
import SimpleDropdown, { Props as SimpleDropdownProps } from '../../components/dropdown/SimpleDropdown';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';

interface OwnProps {
    content?: string;
}

const TopNavbarListItemHelpButton = React.forwardRef(
    (props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>, ref: typeof props.ref) => {
        return (
            <TopNavbarListItemButton
                {...props}
                ref={ref}
                as="button"
                type="button"
                icon={<Icon name="what-is-this" />}
                text={c('Header').t`Help`}
            />
        );
    }
);

const userVoiceLinks: Partial<{ [key in APP_NAMES]: string }> = {
    [APPS.PROTONMAIL]: 'https://protonmail.uservoice.com/',
    [APPS.PROTONCALENDAR]: 'https://protonmail.uservoice.com/forums/932842-proton-calendar',
    [APPS.PROTONDRIVE]: 'https://protonmail.uservoice.com/forums/932839-proton-drive',
    [APPS.PROTONVPN_SETTINGS]: 'https://protonmail.uservoice.com/forums/932836-protonvpn',
};

const defaultElement = TopNavbarListItemHelpButton;
type Props<E extends React.ElementType> = OwnProps & Omit<SimpleDropdownProps<E>, 'content'>;

const TopNavbarListItemHelpDropdown = <E extends React.ElementType = typeof defaultElement>({ ...rest }: Props<E>) => {
    const { UID } = useAuthentication();
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const isAuthenticated = !!UID;
    const app = getAppFromPathnameSafe(window.location.pathname);
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS || app === APPS.PROTONVPN_SETTINGS;

    const handleBugReportClick = () => {
        createModal(isAuthenticated ? <AuthenticatedBugModal /> : <BugModal />);
    };

    const handleTourClick = () => {
        createModal(<OnboardingModal showGenericSteps allowClose hideDisplayName />);
    };

    return (
        <SimpleDropdown
            as={defaultElement}
            originalPlacement="bottom-left"
            hasCaret={false}
            dropdownStyle={{ '--min-width': '18em' }}
            title={c('Title').t`Open help menu`}
            {...rest}
        >
            <DropdownMenu>
                <DropdownMenuLink
                    className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                    href={isVPN ? 'https://protonvpn.com/support/' : 'https://protonmail.com/support/'}
                    // eslint-disable-next-line react/jsx-no-target-blank
                    target="_blank"
                >
                    {c('Action').t`I have a question`}
                    <Icon className="ml1" name="external-link" />
                </DropdownMenuLink>

                {APP_NAME !== APPS.PROTONVPN_SETTINGS && (
                    <DropdownMenuButton className="text-left" onClick={handleTourClick}>
                        {c('Action').t`${BRAND_NAME} introduction`}
                    </DropdownMenuButton>
                )}

                <hr className="mt0-5 mb0-5" />

                <DropdownMenuLink
                    className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                    href={userVoiceLinks[APP_NAME] || userVoiceLinks[APPS.PROTONMAIL]}
                    target="_blank"
                >
                    {c('Action').t`Request a feature`}
                    <Icon className="ml1" name="external-link" />
                </DropdownMenuLink>

                <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                    {c('Action').t`Report a problem`}
                </DropdownMenuButton>

                <hr className="mt0-5 mb0-5" />

                <DropdownMenuLink
                    className="text-left flex flex-nowrap flex-justify-space-between flex-align-items-center"
                    href="https://shop.protonmail.com"
                    target="_blank"
                >
                    {c('Action').t`${BRAND_NAME} shop`}
                    <Icon className="ml1" name="external-link" />
                </DropdownMenuLink>
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default TopNavbarListItemHelpDropdown;
