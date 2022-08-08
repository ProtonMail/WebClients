import { ReactNode, useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isAuthorizedSideAppUrl, postMessageFromIframe } from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';

import { AppLink, Button, Icon, Tooltip } from '../../../components';
import Header from '../../../components/header/Header';
import { useConfig, useEventManager, useHotkeys, useSideApp } from '../../../hooks';
import { useTheme } from '../../themes';

import './PrivateSideAppHeader.scss';

export interface PrivateIframeHeaderProps {
    toLink?: string;
    customTitle?: ReactNode;
    customActions?: ReactNode;
    dropdownItem?: ReactNode;
    onCloseDropdown?: () => void;
}

const PrivateSideAppHeader = ({
    toLink = '',
    customTitle,
    customActions,
    dropdownItem,
    onCloseDropdown,
}: PrivateIframeHeaderProps) => {
    const { call } = useEventManager();
    const [theme, setTheme] = useTheme();
    const { parentApp } = useSideApp();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { APP_NAME } = useConfig();
    const appName = APPS_CONFIGURATION[APP_NAME].name;

    const handleToggleIFrame = (nextUrl?: string, closeDefinitely?: boolean) => {
        if (!parentApp) {
            return;
        }

        onCloseDropdown?.();
        // If nextUrl, we want to switch from app, so we need to pass the nextUrl
        if (nextUrl) {
            postMessageFromIframe(
                {
                    type: SIDE_APP_EVENTS.SIDE_APP_SWITCH,
                    payload: { app: APP_NAME, url: window.location.href, nextUrl: nextUrl },
                },
                parentApp
            );
        } else {
            postMessageFromIframe(
                {
                    type: SIDE_APP_EVENTS.SIDE_APP_CLOSE,
                    payload: { app: APP_NAME, url: window.location.href, closeDefinitely },
                },
                parentApp
            );
        }
    };

    const handleTriggerToggleFromOutside = useCallback(
        (event: MessageEvent<SIDE_APP_ACTION>) => {
            const origin = event.origin;

            if (!isAuthorizedSideAppUrl(origin)) {
                return;
            }

            switch (event.data.type) {
                case SIDE_APP_EVENTS.SIDE_APP_CLOSE_FROM_OUTSIDE:
                    const { closeDefinitely } = event.data.payload || { closeDefinitely: undefined };
                    handleToggleIFrame(undefined, closeDefinitely);
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_SWITCH_FROM_OUTSIDE:
                    const { nextUrl } = event.data.payload;
                    handleToggleIFrame(nextUrl);
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_CALL_EVENT_MANAGER_FROM_OUTSIDE:
                    void call();
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_UPDATE_THEME:
                    const { theme: receivedTheme } = event.data.payload;
                    if (theme !== receivedTheme) {
                        setTheme(receivedTheme);
                    }
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

    // Listen for click events outside the header in order to close the dropdown
    useEffect(() => {
        if (!dropdownItem) {
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
    }, [dropdownItem]);

    useHotkeys(dropdownRef, [
        [
            KeyboardKey.Escape,
            (e) => {
                e.stopPropagation();
                onCloseDropdown?.();
            },
        ],
    ]);

    return (
        <div className="relative ui-standard color-norm" ref={wrapperRef}>
            <Header className="pl1">
                <div className="flex flex-justify-space-between flex-align-items-center w100">
                    {customTitle ? customTitle : <span>{appName}</span>}

                    <div className="flex flex-align-items-center flex-nowrap">
                        {customActions}
                        <Tooltip title={c('Action').t`Open in a new tab`}>
                            <AppLink to={toLink} selfOpening className="mr0-5 button button-ghost-weak button-for-icon">
                                <Icon name="arrow-out-square" size={16} />
                            </AppLink>
                        </Tooltip>

                        <Tooltip title={c('Action').t`Close`}>
                            <Button icon color="weak" shape="ghost" onClick={() => handleToggleIFrame()}>
                                <Icon name="cross-big" size={16} />
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </Header>
            {dropdownItem && (
                <div
                    className="private-side-app-header-dropdownItem absolute w100 border-top border-weak shadow-norm"
                    ref={dropdownRef}
                >
                    {dropdownItem}
                </div>
            )}
        </div>
    );
};

export default PrivateSideAppHeader;
