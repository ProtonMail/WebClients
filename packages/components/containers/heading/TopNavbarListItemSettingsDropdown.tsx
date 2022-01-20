import { forwardRef, ComponentPropsWithoutRef } from 'react';
import { c } from 'ttag';
import { PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';

import { AppLink, DropdownMenu, DropdownMenuButton, DropdownMenuLink, Icon } from '../../components';
import SimpleDropdown from '../../components/dropdown/SimpleDropdown';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import { useEarlyAccess, useModals } from '../../hooks';
import ThemesModal from '../themes/ThemesModal';
import EarlyAccessModal from '../earlyAccess/EarlyAccessModal';
import { useTheme } from '../themes';

const TopNavbarListItemSettingsButton = forwardRef(
    (props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>, ref: typeof props.ref) => {
        return (
            <TopNavbarListItemButton
                {...props}
                ref={ref}
                type="button"
                as="button"
                data-test-id="view:general-settings"
                icon={<Icon name="gear" />}
                text={c('Text').t`Settings`}
                title={c('Title').t`Open settings menu`}
            />
        );
    }
);

interface Props extends ComponentPropsWithoutRef<typeof AppLink> {
    children?: React.ReactNode;
}

const TopNavbarListItemSettingsDropdown = (props: Props) => {
    const { createModal } = useModals();
    const earlyAccess = useEarlyAccess();
    const [theme] = useTheme();

    const handleEarlyAccessClick = () => {
        createModal(<EarlyAccessModal />);
    };

    const handleThemeClick = () => {
        createModal(<ThemesModal />);
    };

    const { to, toApp, children } = props;

    return (
        <SimpleDropdown
            as={TopNavbarListItemSettingsButton}
            originalPlacement="bottom-left"
            hasCaret={false}
            dropdownStyle={{ '--min-width': '18em', '--max-height': 'none' }}
        >
            <DropdownMenu>
                <DropdownMenuLink as={AppLink} to={to} toApp={toApp} target="_self">
                    {c('Action').t`Go to settings`}
                </DropdownMenuLink>

                <hr className="mt0-5 mb0-5" />

                <DropdownMenuButton
                    onClick={handleEarlyAccessClick}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Beta Access`}</span>
                    <span className="color-primary ml0-5">
                        {earlyAccess.value ? c('Early Access Enabled').t`On` : c('Early Access Disabled').t`Off`}
                    </span>
                </DropdownMenuButton>

                <DropdownMenuButton
                    onClick={handleThemeClick}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    <span className="flex-item-fluid text-left">{c('Action').t`Theme`}</span>
                    <span className="color-primary ml0-5">{PROTON_THEMES_MAP[theme].label}</span>
                </DropdownMenuButton>
                {children}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default TopNavbarListItemSettingsDropdown;
