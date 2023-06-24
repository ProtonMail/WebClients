import type { ReactNode, VFC } from 'react';

import { Card } from '@proton/atoms/Card';
import { AutoSaveType, FormEntryStatus, FormType } from '@proton/pass/types';

import { NOTIFICATION_HEIGHT, NOTIFICATION_WIDTH } from '../../../content/constants';
import { NotificationSwitch } from '../../../content/injections/apps/notification/components/NotificationSwitch';
import { NotificationAction } from '../../../content/types';

const MockIFrameContainer: VFC<{ children: ReactNode }> = ({ children }) => (
    <div
        style={{
            width: NOTIFICATION_WIDTH,
            height: NOTIFICATION_HEIGHT,
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

export const NotificationDebug: VFC = () => {
    return (
        <Card rounded className="mb-4 p-3 relative">
            <strong className="color-norm block">Notification</strong>
            <hr className="mt-2 mb-4 border-weak" />
            <div className="gap-4" style={{ columnCount: 2 }}>
                <MockIFrameContainer>
                    <NotificationSwitch state={null} />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <NotificationSwitch
                        state={{
                            action: NotificationAction.AUTOSAVE_PROMPT,
                            submission: {
                                status: FormEntryStatus.COMMITTED,
                                domain: 'proton.me',
                                subdomain: null,
                                type: FormType.LOGIN,
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
                    />
                </MockIFrameContainer>

                <MockIFrameContainer>
                    <NotificationSwitch
                        state={{
                            action: NotificationAction.AUTOSAVE_PROMPT,
                            submission: {
                                status: FormEntryStatus.COMMITTED,
                                domain: 'proton.me',
                                subdomain: null,
                                type: FormType.LOGIN,
                                partial: false,
                                autosave: {
                                    shouldPrompt: true,
                                    data: {
                                        action: AutoSaveType.UPDATE,
                                        item: {
                                            data: {
                                                type: 'login',
                                                metadata: { name: 'Proton.me', note: 'Autosaved', itemUuid: '' },
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
                                    password: 'proton123',
                                },
                            },
                        }}
                    />
                </MockIFrameContainer>
            </div>
        </Card>
    );
};
