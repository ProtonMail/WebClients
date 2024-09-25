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
import { selectLoginItems } from '@proton/pass/store/selectors';
import { AppStatus, AutosaveMode } from '@proton/pass/types';

import { MockIFrameContainer } from './MockIFrameContainer';

export const NotificationDebug: FC = () => {
    const loginItems = useSelector(selectLoginItems);
    const otpItem = loginItems.find((item) => Boolean(item.data.content.totpUri.v));

    return (
        <SettingsPanel title="Notification">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer
                    appState={{ authorized: false, status: AppStatus.IDLE }}
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    domain="proton.me"
                    payload={{
                        action: NotificationAction.AUTOSAVE,
                        data: {
                            submittedAt: -1,
                            type: AutosaveMode.NEW,
                            userIdentifier: 'nobody@proton.me',
                            password: 'proton123',
                        },
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    domain="netflix.com"
                    payload={{
                        action: NotificationAction.AUTOSAVE,
                        data: {
                            submittedAt: -1,
                            type: AutosaveMode.UPDATE,
                            userIdentifier: 'nobody@proton.me',
                            password: 'password',
                            candidates: [
                                {
                                    itemId: 'test-itemId',
                                    shareId: 'test-shareId',
                                    name: 'netflix.com',
                                    userIdentifier: 'john@proton.me',
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
                    domain="netflix.com"
                    payload={{
                        action: NotificationAction.AUTOSAVE,
                        data: {
                            submittedAt: -1,
                            type: AutosaveMode.UPDATE,
                            candidates: [
                                {
                                    itemId: 'test-itemId',
                                    shareId: 'test-shareId',
                                    name: 'Netflix family',
                                    userIdentifier: 'john@proton.me',
                                    url: 'netflix.com',
                                },
                                {
                                    itemId: 'test-itemId2',
                                    shareId: 'test-shareId2',
                                    name: 'Netflix Oscar',
                                    userIdentifier: '',
                                    url: 'netflix.com',
                                },
                            ],
                            userIdentifier: 'nobody@proton.me',
                            password: 'password',
                        },
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    domain="webauthn.io"
                    payload={{
                        action: NotificationAction.PASSKEY_GET,
                        token: 'some-token',
                        request: JSON.stringify({}),
                        passkeys: [],
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                <MockIFrameContainer
                    width={NOTIFICATION_WIDTH}
                    height={NOTIFICATION_HEIGHT}
                    domain="webauthn.io"
                    payload={{
                        action: NotificationAction.PASSKEY_CREATE,
                        token: 'some-token',
                        request: JSON.stringify({
                            rp: {
                                name: 'webauthn.io',
                                id: 'webauthn.io',
                            },
                            user: {
                                id: 'igHw8ywfAyFqAabwFcBRnAqyNUi3NG2nB9huIWAxseU',
                                name: 'Nobody',
                                displayName: 'Nobody',
                            },
                            challenge:
                                'l196lpn2WQgvnd5BD-tShTTj6FhB_FOj0AmNFlrTl2WN9qY5XUrsEftE1CCa_LJmQs9GqiVxvNu5rJWGih2rPw',
                            pubKeyCredParams: [
                                { type: 'public-key', alg: -7 },
                                { type: 'public-key', alg: -257 },
                            ],
                        }),
                    }}
                >
                    <Notification />
                </MockIFrameContainer>

                {otpItem && (
                    <MockIFrameContainer
                        width={NOTIFICATION_WIDTH}
                        height={NOTIFICATION_HEIGHT_SM}
                        domain="proton.me"
                        payload={{
                            action: NotificationAction.OTP,
                            item: { shareId: otpItem.shareId, itemId: otpItem.itemId },
                        }}
                    >
                        <Notification />
                    </MockIFrameContainer>
                )}
            </div>
        </SettingsPanel>
    );
};
