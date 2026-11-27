import { render, screen, waitFor } from '@testing-library/react';

import { MockIFrameApp } from '../../../../../../../lib/components/Settings/debug/MockIFrameApp';
import { WorkerMessageType } from '../../../../../../../types/messages';
import { InlineToastAction } from '../../../../../constants.runtime';
import { PasskeyCreate } from './PasskeyCreate';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

vi.mock('@proton/pass/components/Core/PassCoreProvider', () => ({
    usePassCore: () => ({ onTelemetry: vi.fn(), config: { APP_URL: 'https://pass.test' } }),
}));

vi.mock('../../../../../../../lib/message/send-message', () => ({
    contentScriptMessage: <T extends { type: string }>(message: T) => message,
    sendMessage: Object.assign(
        vi.fn(async (message: { type: string }) => {
            if (message.type === WorkerMessageType.AUTOFILL_LOGIN_QUERY) return { type: 'success' as const, items: [] };
            if (message.type === WorkerMessageType.PASSKEY_CREATE) {
                return { type: 'success' as const, intercept: false };
            }
            return { type: 'success' as const };
        }),
        {
            on: vi.fn(),
            onSuccess: vi.fn(),
        }
    ),
}));

vi.mock('../../../../../../../lib/components/Inline/AutosaveVaultPicker', () => ({
    AutosaveVaultPicker: () => null,
}));

vi.mock('../components/ToastHeader', () => ({
    ToastHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../../../../../../lib/components/Inline/WithUnlock', () => ({
    WithUnlock: ({ children }: { children: (locked: boolean) => React.ReactNode }) => <>{children(false)}</>,
}));

const publicKeyRequest = JSON.stringify({
    challenge: 'test',
    rp: { id: 'example.com', name: 'Example' },
    user: { id: '1', name: 'user@test.com', displayName: 'User' },
    pubKeyCredParams: [],
});

describe('PasskeyCreate', () => {
    test('prefills the title from defaultItemName when creating a new login', async () => {
        render(
            <MockIFrameApp width={400} domain="login.example.com">
                <PasskeyCreate
                    action={InlineToastAction.PASSKEY_CREATE}
                    domain="login.example.com"
                    request={publicKeyRequest}
                    token="token"
                    defaultItemName="Example"
                />
            </MockIFrameApp>
        );

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Example'));
    });

    test('prefills the title from the iframe domain when defaultItemName is missing', async () => {
        render(
            <MockIFrameApp width={400} domain="login.example.com">
                <PasskeyCreate
                    action={InlineToastAction.PASSKEY_CREATE}
                    domain="login.example.com"
                    request={publicKeyRequest}
                    token="token"
                />
            </MockIFrameApp>
        );

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('login.example.com'));
    });
});
