import { forwardRef, ComponentPropsWithoutRef } from 'react';
import { c } from 'ttag';
import { PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';
import { APPS, COMPOSER_MODE, DENSITY, VIEW_LAYOUT } from '@proton/shared/lib/constants';

import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { AppLink, DropdownMenu, DropdownMenuButton, DropdownMenuLink, Icon } from '../../components';
import SimpleDropdown from '../../components/dropdown/SimpleDropdown';
import TopNavbarListItemButton, {
    TopNavbarListItemButtonProps,
} from '../../components/topnavbar/TopNavbarListItemButton';
import { useConfig, useEarlyAccess, useMailSettings, useUserSettings, useModals } from '../../hooks';
import { MailShortcutsModal } from '../mail';
import ThemesModal from '../themes/ThemesModal';
import EarlyAccessModal from '../earlyAccess/EarlyAccessModal';
import { useTheme } from '../themes';
import MailDensityModal from '../mail/MailDensityModal';
import MailViewLayoutModal from '../mail/MailViewLayoutModal';
import MailComposerModeModal from '../mail/MailComposerModeModal';
import MailDefaultHandlerModal from '../mail/MailDefaultHandlerModal';

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
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();
    const earlyAccess = useEarlyAccess();
    const [theme] = useTheme();
    const [{ Density }] = useUserSettings();
    const [{ Shortcuts, ComposerMode, ViewLayout } = { Shortcuts: 0, ComposerMode: 0, ViewLayout: 0 }] =
        useMailSettings();

    const handleEarlyAccessClick = () => {
        createModal(<EarlyAccessModal />);
    };

    const handleThemeClick = () => {
        createModal(<ThemesModal />);
    };

    const handleKeyboardShortcutsClick = () => {
        createModal(<MailShortcutsModal />, 'shortcuts-modal');
    };

    const handleDensityClick = () => {
        createModal(<MailDensityModal />);
    };

    const handleViewLayoutClick = () => {
        createModal(<MailViewLayoutModal />);
    };

    const handleComposerModeClick = () => {
        createModal(<MailComposerModeModal />);
    };

    const handleDefaultMailHandlerClick = () => {
        createModal(<MailDefaultHandlerModal />);
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
                {APP_NAME === APPS.PROTONMAIL && (
                    <>
                        <hr className="mt0-5 mb0-5" />
                        <DropdownMenuButton
                            onClick={handleKeyboardShortcutsClick}
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        >
                            <span className="flex-item-fluid text-left">{c('Action').t`Keyboard shortcuts`}</span>
                            <span className="color-primary ml0-5">
                                {Shortcuts
                                    ? c('Keyboard Shortcuts Enabled').t`On`
                                    : c('Keyboard Shortcuts Disabled').t`Off`}
                            </span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            onClick={handleViewLayoutClick}
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center no-mobile"
                        >
                            <span className="flex-item-fluid text-left">{c('Action').t`Mailbox layout`}</span>
                            <span className="color-primary ml0-5">
                                {ViewLayout === VIEW_LAYOUT.COLUMN
                                    ? c('Layout mode').t`Column`
                                    : c('Layout mode').t`Row`}
                            </span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            onClick={handleDensityClick}
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center"
                        >
                            <span className="flex-item-fluid text-left">{c('Action').t`Mailbox density`}</span>
                            <span className="color-primary flex-item-noshrink ml0-5">
                                {Density === DENSITY.COMFORTABLE
                                    ? c('Density mode').t`Comfortable`
                                    : c('Density mode').t`Compact`}
                            </span>
                        </DropdownMenuButton>
                        <DropdownMenuButton
                            onClick={handleComposerModeClick}
                            className="flex flex-nowrap flex-justify-space-between flex-align-items-center no-mobile"
                        >
                            <span className="flex-item-fluid text-left">{c('Action').t`Composer size`}</span>
                            <span className="color-primary ml0-5">
                                {ComposerMode === COMPOSER_MODE.MAXIMIZED
                                    ? c('Composer size').t`Maximized`
                                    : c('Composer size').t`Normal`}
                            </span>
                        </DropdownMenuButton>
                        {isFirefox() && (
                            <DropdownMenuButton
                                onClick={handleDefaultMailHandlerClick}
                                className="flex flex-nowrap flex-justify-space-between flex-align-items-center no-mobile"
                            >
                                <span className="flex-item-fluid text-left">{c('Action')
                                    .t`Default email application`}</span>
                            </DropdownMenuButton>
                        )}
                    </>
                )}

                {children}
            </DropdownMenu>
        </SimpleDropdown>
    );
};

export default TopNavbarListItemSettingsDropdown;
