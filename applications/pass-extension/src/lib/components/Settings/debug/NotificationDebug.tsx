import type { ReactNode, VFC } from 'react';
import { useSelector } from 'react-redux';

import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectItemsByType } from '@proton/pass/store/selectors';
import { AutoSaveType, FormEntryStatus } from '@proton/pass/types';

import { NOTIFICATION_HEIGHT, NOTIFICATION_WIDTH } from '../../../../app/content/constants.static';
import { NotificationSwitch } from '../../../../app/content/injections/apps/notification/components/NotificationSwitch';
import { NotificationAction } from '../../../../app/content/types';
import { SettingsPanel } from '../SettingsPanel';

const MockIFrameContainer: VFC<{ children: ReactNode; height?: number }> = ({
    children,
    height = NOTIFICATION_HEIGHT,
}) => (
    <div
        style={{
            width: NOTIFICATION_WIDTH,
            height,
            overflow: 'hidden',
            background: '#191927',
            boxShadow: '0 2px 10px rgb(0 0 0 / 0.3)',
            borderRadius: 12,
            marginBottom: 12,
        }}
    >
        {children}
    </div>
);

const MockSettings = { loadDomainImages: true } as ProxiedSettings;

export const NotificationDebug: VFC = () => {
    const otpItem = useSelector(selectItemsByType('login')).find((item) => Boolean(item.data.content.totpUri.v));

    return (
        <SettingsPanel title="Notification">
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer>
                    <NotificationSwitch state={null} settings={MockSettings} />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <NotificationSwitch
                        state={{
                            action: NotificationAction.AUTOSAVE_PROMPT,
                            submission: {
                                status: FormEntryStatus.COMMITTED,
                                domain: 'proton.me',
                                subdomain: null,
                                type: 'login',
                                partial: false,
                                autosave: {
                                    shouldPrompt: true,
                                    data: { action: AutoSaveType.NEW },
                                },
                                data: {
                                    username: 'nobody@proton.me',
                                    password: 'proton123',
                                },
                            },
                        }}
                        settings={MockSettings}
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <NotificationSwitch
                        state={{
                            action: NotificationAction.AUTOSAVE_PROMPT,
                            submission: {
                                status: FormEntryStatus.COMMITTED,
                                domain: 'netflix.com',
                                subdomain: null,
                                type: 'login',
                                partial: false,
                                autosave: {
                                    shouldPrompt: true,
                                    data: {
                                        action: AutoSaveType.UPDATE,
                                        item: {
                                            data: {
                                                type: 'login',
                                                metadata: { name: 'netflix.com', note: 'Autosaved', itemUuid: '' },
                                                content: {
                                                    username: 'nobody@proton.me',
                                                    password: '',
                                                    urls: [],
                                                    totpUri: '',
                                                },
                                                extraFields: [],
                                            },
                                        } as any,
                                    },
                                },
                                data: {
                                    username: 'nobody@proton.me',
                                    password: 'password',
                                },
                            },
                        }}
                        settings={MockSettings}
                    />
                </MockIFrameContainer>

                {otpItem && (
                    <MockIFrameContainer height={220}>
                        <NotificationSwitch
                            state={{
                                action: NotificationAction.AUTOFILL_OTP_PROMPT,
                                item: { shareId: otpItem.shareId, itemId: otpItem.itemId },
                                hostname: 'proton.me',
                            }}
                            settings={MockSettings}
                        />
                    </MockIFrameContainer>
                )}
            </div>
        </SettingsPanel>
    );
};
