import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useTheme } from '@proton/components/containers';
import {
    closeDrawerFromChildApp,
    getIsDrawerPostMessage,
    getIsNativeDrawerApp,
    postMessageFromIframe,
} from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { KeyboardKey } from '@proton/shared/lib/interfaces';

import { Icon, Tooltip } from '../../components';
import Header from '../../components/header/Header';
import { useConfig, useDrawer, useEventManager, useHotkeys } from '../../hooks';

import './DrawerAppHeader.scss';

export interface PrivateIframeHeaderProps {
    title?: ReactNode;
    onCloseDropdown?: () => void;

    // Need to set this to true for iframes apps. When inside an iframe, the window width is really small
    // So, If we want to display a dropdown "correctly" (not in a modal) we need to make a special case for now
    customDropdown?: ReactNode;
}

const DrawerAppHeader = ({ title, onCloseDropdown, customDropdown }: PrivateIframeHeaderProps) => {
    const { call } = useEventManager();
    const theme = useTheme();
    const { appInView, setAppInView, parentApp } = useDrawer();
    const { APP_NAME: currentApp } = useConfig();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Listen for click events outside the header in order to close the dropdown
    useEffect(() => {
        if (!customDropdown) {
            return;
        }

        const handleClickOutside = ({ target }: MouseEvent) => {
            const targetNode = target as HTMLElement;
            const wrapperEl = wrapperRef.current;
            // Do nothing if clicking ref's element or descendent elements
            if (wrapperEl?.contains(targetNode)) {
                return;
            }
            onCloseDropdown?.();
        };

        document.addEventListener('click', handleClickOutside, { capture: true });

        return () => {
            document.removeEventListener('click', handleClickOutside, { capture: true });
        };
    }, [customDropdown]);

    useHotkeys(dropdownRef, [
        [
            KeyboardKey.Escape,
            (e) => {
                if (customDropdown) {
                    e.stopPropagation();
                    onCloseDropdown?.();
                }
            },
        ],
    ]);

    const handleToggleIFrame = (nextUrl?: string, closeDefinitely?: boolean) => {
        if (appInView && getIsNativeDrawerApp(appInView)) {
            // we have access to parent drawer methods
            setAppInView(undefined);
        } else {
            // Otherwise we are inside an iframed app

            if (!parentApp) {
                // just for TS safety
                return;
            }

            onCloseDropdown?.();

            // If we receive a nextUrl, it means we want to switch to another iframed app, so we need to pass the nextUrl
            if (nextUrl) {
                postMessageFromIframe(
                    {
                        type: DRAWER_EVENTS.SWITCH,
                        payload: { nextUrl },
                    },
                    parentApp
                );
            } else {
                // Otherwise, we only want to close the iframed app
                closeDrawerFromChildApp(parentApp, currentApp, closeDefinitely);
            }
        }
    };

    const handleTriggerToggleFromOutside = useCallback(
        (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case DRAWER_EVENTS.CALL_EVENT_MANAGER_FROM_OUTSIDE:
                case DRAWER_EVENTS.SHOW:
                    void call();
                    break;
                case DRAWER_EVENTS.UPDATE_THEME:
                    const { themeSetting } = event.data.payload;
                    theme.setThemeSetting(themeSetting);
                    break;
                default:
                    break;
            }
        },
        [theme]
    );

    // Listen for app closing or app switching events outside the iframe
    useEffect(() => {
        window.addEventListener('message', handleTriggerToggleFromOutside);

        return () => {
            window.removeEventListener('message', handleTriggerToggleFromOutside);
        };
    }, [handleTriggerToggleFromOutside]);

    return (
        <div className="relative ui-standard color-norm shrink-0" ref={wrapperRef}>
            <Header className="header--drawer p-3">
                <div className="drawer-app-header-actions flex justify-space-between items-center w-full">
                    <h2 className="text-bold text-lg">{title}</h2>

                    <div className="flex items-center flex-nowrap gap-2">
                        <Tooltip title={c('Action').t`Close`}>
                            <Button
                                data-testid="drawer-app-header:close"
                                icon
                                color="weak"
                                shape="ghost"
                                onClick={() => handleToggleIFrame()}
                            >
                                <Icon name="cross-big" size={4} alt={c('Action').t`Close`} />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </Header>
            {customDropdown && (
                <div
                    className="drawer-app-header-dropdownItem absolute w-full border-top border-weak shadow-norm"
                    ref={dropdownRef}
                >
                    {customDropdown}
                </div>
            )}
        </div>
    );
};

export default DrawerAppHeader;
