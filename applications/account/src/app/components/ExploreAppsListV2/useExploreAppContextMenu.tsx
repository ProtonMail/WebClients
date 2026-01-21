import type React from 'react';
import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import ContextMenu from '@proton/components/components/contextMenu/ContextMenu';
import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import { DropdownBorderRadius } from '@proton/components/components/dropdown/Dropdown';
import { IcCogWheel } from '@proton/icons/icons/IcCogWheel';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import {
    sendExploreAppsListContextMenuOpenNewTab,
    sendExploreAppsListContextMenuOpenSettings,
} from './exploreAppsListTelemetry';

export const useExploreAppContextMenu = ({ onClick }: { onClick: () => void }) => {
    const anchorRef = useRef<HTMLElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>();
    const [selectedAppHref, setSelectedAppHref] = useState<string | null>(null);
    const [selectedSettingsHref, setSelectedSettingsHref] = useState<string | null>(null);
    const [selectedAppName, setSelectedAppName] = useState<APP_NAMES | null>(null);

    const close = useCallback(() => setIsOpen(false), []);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>, appHref: string, settingsHref: string, appName: APP_NAMES) => {
            e.stopPropagation();
            e.preventDefault();
            setPosition({ top: e.clientY, left: e.clientX });
            setSelectedAppHref(appHref);
            setSelectedSettingsHref(settingsHref);
            setSelectedAppName(appName);
            setIsOpen(true);
        },
        []
    );

    const handleOpenInNewTab = useCallback(() => {
        if (selectedAppHref && selectedAppName) {
            onClick();
            sendExploreAppsListContextMenuOpenNewTab({ appName: selectedAppName });
            window.open(selectedAppHref, '_blank');
        }
        close();
    }, [selectedAppHref, selectedAppName, close, onClick]);

    const handleOpenSettings = useCallback(() => {
        if (selectedAppName) {
            onClick();
            sendExploreAppsListContextMenuOpenSettings({ appName: selectedAppName });
        }
        close();
    }, [selectedAppName, close, onClick]);

    const contextMenu = (
        <ContextMenu
            anchorRef={anchorRef}
            isOpen={isOpen}
            position={position}
            close={close}
            className="explore-app-context-menu shadow-lifted shadow-color-primary"
            borderRadius={DropdownBorderRadius.LG}
        >
            <ContextMenuButton
                testId="context-menu-open-new-tab"
                icon="arrow-out-square"
                name={c('Action').t`Open in new tab`}
                action={handleOpenInNewTab}
            />
            {selectedSettingsHref && (
                // Implemented as `a` to support cmd click to open in new tab
                <a
                    href={selectedSettingsHref}
                    data-testid="context-menu-go-to-settings"
                    className="dropdown-item-button w-full px-4 py-2 flex items-center flex-nowrap text-left text-no-decoration"
                    onClick={handleOpenSettings}
                >
                    <IcCogWheel className="mr-2 shrink-0" />
                    {c('Action').t`Open settings`}
                </a>
            )}
        </ContextMenu>
    );

    return {
        contextMenu,
        onContextMenu: handleContextMenu,
    };
};
