import type { FC, ReactNode } from 'react';
import { forwardRef, useEffect } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormikContextType } from 'formik';

import { NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS } from '@proton/pass/types/data/telemetry';
import type { AutosaveFormValues, AutosavePayload } from '@proton/pass/types/worker/autosave';
import { AutosaveMode } from '@proton/pass/types/worker/autosave';

import { MockIFrameApp } from '../../../../../../../lib/components/Settings/debug/MockIFrameApp';
import { InlineToastAction } from '../../../../../constants.runtime';
import { Autosave } from './Autosave';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

vi.mock('@proton/pass/components/Core/PassCoreProvider', () => ({
    usePassCore: () => ({ onTelemetry: vi.fn() }),
}));

vi.mock('@proton/pass/hooks/useTelemetryEvent', () => ({
    useTelemetryEvent: () => () => {},
}));

let autosaveForm: FormikContextType<AutosaveFormValues> | null = null;

vi.mock('../../../../../../../lib/components/Inline/AutosaveVaultPicker', () => ({
    AutosaveVaultPicker: ({ form }: { form: FormikContextType<AutosaveFormValues> }) => {
        autosaveForm = form;

        useEffect(() => {
            if (!form.values.shareId) {
                void form.setFieldValue('shareId', 'user-vault');
            }
        }, [form]);

        return null;
    },
}));

vi.mock('../../../../../../../lib/message/send-message', () => ({
    contentScriptMessage: <T extends { type: string }>(message: T) => message,
    sendMessage: Object.assign(
        vi.fn(async () => ({ type: 'success' as const })),
        {
            on: vi.fn(),
            onSuccess: vi.fn(),
        }
    ),
}));

vi.mock('../components/AutosaveSelect', () => ({
    AutosaveSelect: () => null,
}));

vi.mock('../components/AutosaveForm', () => ({
    AutosaveForm: ({ form }: { form: FormikContextType<AutosaveFormValues> }) => (
        <input
            aria-label="Title"
            name="name"
            value={form.values.name}
            onChange={(event) => {
                form.setFieldValue('name', event.target.value).catch(() => {});
            }}
        />
    ),
}));

vi.mock('../components/ToastHeader', () => {
    const ToastHeader = forwardRef<HTMLDivElement, { title?: ReactNode; children?: ReactNode }>(
        ({ title, children }, ref) => (
            <div ref={ref}>
                {title}
                {children}
            </div>
        )
    );
    ToastHeader.displayName = 'ToastHeader';

    return { ToastHeader };
});

vi.mock('../../../../../../../lib/components/Inline/PauseListDropdown', () => ({
    PauseListDropdown: () => null,
}));

type AutosaveNewPayload = Extract<AutosavePayload, { type: AutosaveMode.NEW }>;

const createPayload = (overrides: Partial<AutosaveNewPayload> = {}): AutosaveNewPayload => ({
    submittedAt: Date.now(),
    type: AutosaveMode.NEW,
    userIdentifier: 'user@test.com',
    password: 'secret',
    isCurrentProtonAccount: false,
    telemetry: NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS,
    ...overrides,
});

const AutosaveView: FC<{ data: AutosavePayload; domain?: string }> = ({ data, domain }) => (
    <MockIFrameApp width={400} domain={domain}>
        <Autosave action={InlineToastAction.AUTOSAVE} data={data} />
    </MockIFrameApp>
);

describe('Autosave', () => {
    beforeEach(() => {
        autosaveForm = null;
    });

    test('prefills the title from the iframe domain when defaultItemName is missing', async () => {
        render(<AutosaveView data={createPayload()} domain="login.example.com" />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('login.example.com'));
    });

    test('prefills the title from defaultItemName when it is set', async () => {
        render(<AutosaveView data={createPayload({ defaultItemName: 'Netflix' })} domain="www.netflix.com" />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Netflix'));
    });

    test('updates the title when defaultItemName changes and keeps the selected vault', async () => {
        const base = createPayload({ defaultItemName: 'Netflix' });

        const { rerender } = render(<AutosaveView data={base} domain="www.netflix.com" />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Netflix'));
        await waitFor(() => expect(autosaveForm?.values.shareId).toBe('user-vault'));

        rerender(<AutosaveView data={{ ...base, defaultItemName: 'Netflix Watch' }} domain="www.netflix.com" />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Netflix Watch'));
        expect(autosaveForm?.values.shareId).toBe('user-vault');
    });

    test('keeps a user-edited title when defaultItemName changes', async () => {
        const base = createPayload({ defaultItemName: 'Netflix' });

        const { rerender } = render(<AutosaveView data={base} domain="www.netflix.com" />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Netflix'));

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My Netflix login' } });

        rerender(<AutosaveView data={{ ...base, defaultItemName: 'Netflix Watch' }} domain="www.netflix.com" />);

        await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('My Netflix login'));
    });
});
