import type { FC } from 'react';
import { useSelector } from 'react-redux';

import {
    NOTIFICATION_HEIGHT,
    NOTIFICATION_HEIGHT_SM,
    NOTIFICATION_WIDTH,
} from 'proton-pass-extension/app/content/constants.static';
import { Notification } from 'proton-pass-extension/app/content/injections/apps/notification/Notification';
import { NotificationAction } from 'proton-pass-extension/app/content/types';

import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { selectItemsByType } from '@proton/pass/store/selectors';
import { AppStatus, AutosaveMode } from '@proton/pass/types';

import { MockIFrameContainer } from './MockIFrameContainer';

export const NotificationDebug: FC = () => {
    const loginItems = useSelector(selectItemsByType('login'));
    const otpItem = loginItems.find((item) => Boolean(item.data.content.totpUri.v));

    return (
        <SettingsPanel title="Notification">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer
                    appState={{ loggedIn: false, status: AppStatus.IDLE }}
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    payload={{
                        action: NotificationAction.AUTOSAVE,
                        data: {
                            domain: 'proton.me',
                            type: AutosaveMode.NEW,
                            username: 'nobody@proton.me',
                            password: 'proton123',
                        },
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    payload={{
                        action: NotificationAction.AUTOSAVE,
                        data: {
                            domain: 'netflix.com',
                            type: AutosaveMode.UPDATE,
                            username: 'nobody@proton.me',
                            password: 'password',
                            candidates: [
                                {
                                    itemId: 'test-itemId',
                                    shareId: 'test-shareId',
                                    name: 'netflix.com',
                                    username: 'john@proton.me',
                                },
                            ],
                        },
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    payload={{
                        action: NotificationAction.AUTOSAVE,
                        data: {
                            domain: 'netflix.com',
                            type: AutosaveMode.UPDATE,
                            candidates: [
                                {
                                    itemId: 'test-itemId',
                                    shareId: 'test-shareId',
                                    name: 'Netflix family',
                                    username: 'john@proton.me',
                                    url: 'netflix.com',
                                },
                                {
                                    itemId: 'test-itemId2',
                                    shareId: 'test-shareId2',
                                    name: 'Netflix Oscar',
                                    username: '',
                                    url: 'netflix.com',
                                },
                            ],
                            username: 'nobody@proton.me',
                            password: 'password',
                        },
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    payload={{
                        action: NotificationAction.PASSKEY_GET,
                        domain: 'webauthn.io',
                        token: 'some-token',
                        request: JSON.stringify({}),
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                {otpItem && (
                    <MockIFrameContainer
                        width={NOTIFICATION_WIDTH}
                        height={NOTIFICATION_HEIGHT_SM}
                        payload={{
                            action: NotificationAction.OTP,
                            item: { shareId: otpItem.shareId, itemId: otpItem.itemId },
                            hostname: 'proton.me',
                        }}
                    >
                        <Notification />
                    </MockIFrameContainer>
                )}
            </div>
        </SettingsPanel>
    );
};
