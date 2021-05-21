import React, { ComponentPropsWithoutRef } from 'react';
import { c } from 'ttag';
import { PROTON_THEMES } from 'proton-shared/lib/themes/themes';
import { APPS } from 'proton-shared/lib/constants';

import { AppLink, DropdownMenu, DropdownMenuButton, DropdownMenuLink, Icon } from '../../components';
import SimpleDropdown from '../../components/dropdown/SimpleDropdown';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import { useConfig, useEarlyAccess, useMailSettings, useModals } from '../../hooks';
import { MailShortcutsModal } from '../mail';
import ThemesModal from '../themes/ThemesModal';
import EarlyAccessModal from '../earlyAccess/EarlyAccessModal';
import { useTheme } from '../themes';

const TopNavbarListItemSettingsButton = React.forwardRef(
    (props: Omit<TopNavbarListItemButtonProps<'button'>, 'icon' | 'text' | 'as'>, ref: typeof props.ref) => {
        return (
            <TopNavbarListItemButton
                {...props}
                ref={ref}
                type="button"
                as="button"
                data-test-id="view:general-settings"
                icon={<Icon name="settings" />}
                text={c('Text').t`Settings`}
                title={c('Title').t`Open settings menu`}
            />
        );
    }
);

interface Props extends ComponentPropsWithoutRef<typeof AppLink> {}

const TopNavbarListItemSettingsDropdown = (props: Props) => {
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const earlyAccess = useEarlyAccess();
    const [theme] = useTheme();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const handleEarlyAccessClick = () => {
        createModal(<EarlyAccessModal />);
    };

    const handleThemeClick = () => {
        createModal(<ThemesModal />);
    };

    const handleKeyboardShortcutsClick = () => {
        createModal(<MailShortcutsModal />, 'shortcuts-modal');
    };

    const { to, toApp } = props;

    return (
        <SimpleDropdown
            as={TopNavbarListItemSettingsButton}
            originalPlacement="bottom-left"
            hasCaret={false}
            dropdownStyle={{ '--min-width': '16em' }}
        >
            <DropdownMenu>
                <DropdownMenuLink as={AppLink} to={to} toApp={toApp} target="_self">
                    {c('Action').t`Go to settings`}
                </DropdownMenuLink>

                <hr className="mt0-5 mb0-5" />

                {earlyAccess.isEnabled && (
                    <DropdownMenuButton
                        onClick={handleEarlyAccessClick}
                        className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                    >
                        {c('Action').t`Beta Access`}
                        <span className="color-primary ml2">
                            {earlyAccess.value ? c('Enabled').t`On` : c('Disabled').t`Off`}
                        </span>
                    </DropdownMenuButton>
                )}

                <DropdownMenuButton
                    onClick={handleThemeClick}
                    className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                >
                    {c('Action').t`Theme`}
                    <span className="color-primary ml2">{PROTON_THEMES[theme].getI18NLabel()}</span>
                </DropdownMenuButton>
                {APP_NAME === APPS.PROTONMAIL && (
                    <DropdownMenuButton
                        onClick={handleKeyboardShortcutsClick}
                        className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                    >
                        {c('Action').t`Keyboard shortcuts`}
                        <span className="color-primary ml2">
                            {Shortcuts ? c('Enabled').t`On` : c('Disabled').t`Off`}
                        </span>
                    </DropdownMenuButton>
                )}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default TopNavbarListItemSettingsDropdown;
