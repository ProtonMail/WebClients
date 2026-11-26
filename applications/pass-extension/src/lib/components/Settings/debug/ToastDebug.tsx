import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { PROMPT_DEFINITIONS } from '@proton/pass/store/notifications/prompts/definitions';
import { selectAllLoginItems } from '@proton/pass/store/selectors/items';
import { NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS } from '@proton/pass/types/data/telemetry';
import { AutosaveMode } from '@proton/pass/types/worker/autosave';

import { InlineToastAction } from '../../../../app/content/constants.runtime';
import { TOAST_WIDTH } from '../../../../app/content/constants.static';
import { Toast } from '../../../../app/content/services/inline/toast/app/Toast';
import { MockIFrameApp } from './MockIFrameApp';

export const ToastDebug: FC = () => {
    const loginItems = useSelector(selectAllLoginItems);
    const otpItem = loginItems.find((item) => Boolean(item.data.content.totpUri.v.length));

    return (
        <SettingsPanel title="Toast">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameApp width={TOAST_WIDTH} domain="proton.me">
                    <Toast
                        initial={{
                            action: InlineToastAction.TOAST,
                            message: 'This is a generic toast message',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={TOAST_WIDTH} domain="proton.me">
                    <Toast
                        initial={{
                            action: InlineToastAction.AUTOSAVE,
                            data: {
                                isCurrentProtonAccount: true,
                                submittedAt: -1,
                                type: AutosaveMode.NEW,
                                userIdentifier: 'nobody@proton.me',
                                password: 'proton123',
                                telemetry: NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS,
                            },
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={TOAST_WIDTH} domain="netflix.com">
                    <Toast
                        initial={{
                            action: InlineToastAction.AUTOSAVE,
                            data: {
                                isCurrentProtonAccount: false,
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
                                telemetry: NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS,
                            },
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={TOAST_WIDTH} domain="netflix.com">
                    <Toast
                        initial={{
                            action: InlineToastAction.AUTOSAVE,
                            data: {
                                isCurrentProtonAccount: false,
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
                                telemetry: NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS,
                            },
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={TOAST_WIDTH} domain="webauthn.io">
                    <Toast
                        initial={{
                            action: InlineToastAction.PASSKEY_GET,
                            token: 'some-token',
                            request: JSON.stringify({}),
                            passkeys: [],
                            domain: 'webauthn.io',
                        }}
                    />
                </MockIFrameApp>

                <MockIFrameApp width={TOAST_WIDTH} domain="webauthn.io">
                    <Toast
                        initial={{
                            action: InlineToastAction.PASSKEY_CREATE,
                            token: 'some-token',
                            domain: 'webauthn.io',
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
                    />
                </MockIFrameApp>

                <MockIFrameApp width={TOAST_WIDTH} domain="proton.me">
                    <Toast
                        initial={{
                            action: InlineToastAction.OFFLINE_SETUP,
                            data: { id: 'offline-onpage', ...PROMPT_DEFINITIONS['offline-onpage'].copy() },
                        }}
                    />
                </MockIFrameApp>

                {otpItem && (
                    <MockIFrameApp width={TOAST_WIDTH} domain="proton.me">
                        <Toast
                            initial={{
                                action: InlineToastAction.OTP,
                                item: {
                                    shareId: otpItem.shareId,
                                    itemId: otpItem.itemId,
                                    name: 'Netflix family',
                                    userIdentifier: 'john@proton.me',
                                    url: 'netflix.com',
                                },
                            }}
                        />
                    </MockIFrameApp>
                )}
            </div>
        </SettingsPanel>
    );
};
