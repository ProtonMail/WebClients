import React from 'react';
import { c } from 'ttag';
import { APPS, BRAND_NAME } from 'proton-shared/lib/constants';
import { Icon, DropdownMenu, DropdownMenuButton, DropdownMenuLink } from '../../components';
import { useModals, useAuthentication, useConfig, useUser } from '../../hooks';

import BugModal from '../support/BugModal';
import AuthenticatedBugModal from '../support/AuthenticatedBugModal';
import { OnboardingModal } from '../onboarding';
import SimpleDropdown, { Props as SimpleDropdownProps } from '../../components/dropdown/SimpleDropdown';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import { DonateModal } from '../payments';

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

const defaultElement = TopNavbarListItemHelpButton;
type Props<E extends React.ElementType> = OwnProps & Omit<SimpleDropdownProps<E>, 'content'>;

const TopNavbarListItemHelpDropdown = <E extends React.ElementType = typeof defaultElement>({ ...rest }: Props<E>) => {
    const { UID } = useAuthentication();
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const isAuthenticated = !!UID;
    const [user] = useUser();
    const { canPay, isSubUser } = user;

    const handleBugReportClick = () => {
        createModal(isAuthenticated ? <AuthenticatedBugModal /> : <BugModal />);
    };

    const handleTourClick = () => {
        createModal(<OnboardingModal showGenericSteps allowClose hideDisplayName />);
    };

    const handleSupportUsClick = () => {
        createModal(<DonateModal />);
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
                    className="text-left"
                    href={
                        APP_NAME === APPS.PROTONVPN_SETTINGS
                            ? 'https://protonvpn.com/support/'
                            : 'https://protonmail.com/support/'
                    }
                    // eslint-disable-next-line react/jsx-no-target-blank
                    target="_blank"
                >
                    {c('Action').t`Frequently asked questions`}
                </DropdownMenuLink>

                {APP_NAME !== APPS.PROTONVPN_SETTINGS && (
                    <DropdownMenuButton className="text-left" onClick={handleTourClick}>
                        {c('Action').t`${BRAND_NAME} introduction`}
                    </DropdownMenuButton>
                )}

                <hr className="mt0-5 mb0-5" />

                <DropdownMenuLink className="text-left" href="https://protonmail.uservoice.com/" target="_blank">
                    {c('Action').t`Request a feature`}
                </DropdownMenuLink>

                <DropdownMenuButton className="text-left" onClick={handleBugReportClick}>
                    {c('Action').t`Report bug`}
                </DropdownMenuButton>

                <hr className="mt0-5 mb0-5" />

                <DropdownMenuLink className="text-left" href="https://shop.protonmail.com" target="_blank">
                    {c('Action').t`${BRAND_NAME} shop`}
                </DropdownMenuLink>

                {canPay && !isSubUser && (
                    <DropdownMenuButton className="text-left" onClick={handleSupportUsClick}>
                        {c('Action').t`Support us`}
                    </DropdownMenuButton>
                )}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default TopNavbarListItemHelpDropdown;
