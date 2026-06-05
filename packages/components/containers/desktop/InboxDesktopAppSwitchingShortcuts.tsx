import { c } from 'ttag';

import ShortcutsSectionView from '@proton/components/components/shortcuts/ShortcutsSectionView';
import { CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { hasInboxDesktopFeature } from '@proton/shared/lib/desktop/ipcHelpers';
import { metaKey } from '@proton/shared/lib/helpers/browser';

export const showInboxDesktopAppSwitchingShortcuts = hasInboxDesktopFeature('SwitchViewShortcuts');

const getAppSwitchingSection = () => {
    if (!showInboxDesktopAppSwitchingShortcuts) {
        return null;
    }

    return {
        // translator: section header grouping shortcuts provided by the desktop application for navigation (which hosts both Mail and Calendar)
        name: c('Keyboard shortcut section name').t`Desktop app navigation`,
        shortcuts: [
            {
                // translator: keyboard shortcut label for switching to the Mail view from the desktop application; ${MAIL_APP_NAME} is the product name (e.g. "Proton Mail")
                name: c('Keyboard shortcut name, switch to Mail').t`Switch to ${MAIL_APP_NAME}`,
                keys: `${metaKey} + 1`,
            },
            {
                // translator: keyboard shortcut label for switching to the Calendar view from the desktop application; ${CALENDAR_APP_NAME} is the product name (e.g. "Proton Calendar")
                name: c('Keyboard shortcut name, switch to Calendar').t`Switch to ${CALENDAR_APP_NAME}`,
                keys: `${metaKey} + 2`,
            },
        ],
    };
};

const InboxDesktopAppSwitchingShortcuts = () => {
    const section = getAppSwitchingSection();
    if (!section) {
        return null;
    }

    return <ShortcutsSectionView {...section} />;
};

export default InboxDesktopAppSwitchingShortcuts;
