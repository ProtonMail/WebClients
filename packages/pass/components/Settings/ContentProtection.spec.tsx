import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import NotificationsChildren from '@proton/components/containers/notifications/Children';
import NotificationsProvider from '@proton/components/containers/notifications/Provider';

import { ContentProtection } from './ContentProtection';

const renderSettings = () =>
    render(
        <NotificationsProvider>
            <ContentProtection />
            <NotificationsChildren />
        </NotificationsProvider>
    );

describe('Screen privacy settings', () => {
    const resizeObserverDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
    const desktopBuildDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'DESKTOP_BUILD');
    const buildTargetDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BUILD_TARGET');

    beforeAll(() => {
        Object.defineProperty(window, 'ResizeObserver', {
            configurable: true,
            value: class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        });
    });

    afterAll(() => {
        if (resizeObserverDescriptor) Object.defineProperty(window, 'ResizeObserver', resizeObserverDescriptor);
        else Reflect.deleteProperty(window, 'ResizeObserver');
    });
    const bridgeDescriptor = Object.getOwnPropertyDescriptor(window, 'ctxBridge');

    beforeEach(() => {
        Object.defineProperty(globalThis, 'DESKTOP_BUILD', { configurable: true, value: true });
        Object.defineProperty(globalThis, 'BUILD_TARGET', { configurable: true, value: 'win32' });
    });

    afterEach(() => {
        if (desktopBuildDescriptor) Object.defineProperty(globalThis, 'DESKTOP_BUILD', desktopBuildDescriptor);
        else Reflect.deleteProperty(globalThis, 'DESKTOP_BUILD');
        if (buildTargetDescriptor) Object.defineProperty(globalThis, 'BUILD_TARGET', buildTargetDescriptor);
        else Reflect.deleteProperty(globalThis, 'BUILD_TARGET');
        if (bridgeDescriptor) Object.defineProperty(window, 'ctxBridge', bridgeDescriptor);
        else delete window.ctxBridge;
    });

    test('does not report protection as enabled until the desktop confirms the change', async () => {
        let confirm!: () => void;
        const pending = new Promise<void>((resolve) => {
            confirm = resolve;
        });
        Object.defineProperty(window, 'ctxBridge', {
            configurable: true,
            value: { getContentProtection: async () => false, setContentProtection: () => pending },
        });
        renderSettings();
        const checkbox = screen.getByRole('checkbox');
        await waitFor(() => expect(checkbox).toBeEnabled());

        fireEvent.click(checkbox);
        expect(checkbox).toBeDisabled();
        expect(checkbox).not.toBeChecked();

        await act(async () => confirm());
        expect(checkbox).toBeEnabled();
        expect(checkbox).toBeChecked();
    });

    test('keeps the preference unavailable when its saved state cannot be read', async () => {
        Object.defineProperty(window, 'ctxBridge', {
            configurable: true,
            value: {
                getContentProtection: async () => {
                    throw new Error('IPC unavailable');
                },
            },
        });
        renderSettings();

        expect(await screen.findByRole('alert')).toBeVisible();
        expect(screen.getByRole('checkbox')).toBeDisabled();
        expect(screen.getByRole('checkbox')).toBePartiallyChecked();
    });

    test('keeps the confirmed preference and reports a rejected update', async () => {
        Object.defineProperty(window, 'ctxBridge', {
            configurable: true,
            value: {
                getContentProtection: async () => true,
                setContentProtection: async () => {
                    throw new Error('Cannot save setting');
                },
            },
        });
        renderSettings();
        const checkbox = screen.getByRole('checkbox');
        await waitFor(() => expect(checkbox).toBeEnabled());

        fireEvent.click(checkbox);
        expect(await screen.findByRole('alert')).toBeVisible();
        expect(checkbox).toBeEnabled();
        expect(checkbox).toBeChecked();
    });
});
