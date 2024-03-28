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
import { AppStatus, AutosaveType, FormEntryStatus } from '@proton/pass/types';

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
                        submission: {
                            status: FormEntryStatus.COMMITTED,
                            domain: 'proton.me',
                            subdomain: null,
                            type: 'login',
                            partial: false,
                            autosave: {
                                shouldPrompt: true,
                                data: { type: AutosaveType.NEW },
                            },
                            data: {
                                username: 'nobody@proton.me',
                                password: 'proton123',
                            },
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
                        submission: {
                            status: FormEntryStatus.COMMITTED,
                            domain: 'netflix.com',
                            subdomain: null,
                            type: 'login',
                            partial: false,
                            autosave: {
                                shouldPrompt: true,
                                data: {
                                    type: AutosaveType.UPDATE,
                                    name: 'netflix.com',
                                    selectedItem: {
                                        itemId: 'test-itemId',
                                        shareId: 'test-shareId',
                                    },
                                },
                            },
                            data: {
                                username: 'nobody@proton.me',
                                password: 'password',
                            },
                        },
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
