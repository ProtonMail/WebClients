import { useEffect } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { defaultApiStatus } from '@proton/account/apiStatus';
import { buildUser } from '@proton/account/testing/buildUser';
import { useUser } from '@proton/account/user/hooks';
import { mockUseConfig } from '@proton/app-context/testing/mockUseConfig';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import useOnline from '@proton/components/hooks/useOnline';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { useFlag } from '@proton/unleash/useFlag';

import { LumoFloatingPanelProvider } from '../../lumo/floating/LumoFloatingPanelProvider';
import { useMailSelector } from '../../store/hooks';
import LumoInMailToggle from './LumoInMailToggle';

jest.mock('@proton/account/user/hooks', () => {
    return { useUser: jest.fn() };
});
jest.mock('@proton/unleash/useFlag', () => {
    return { useFlag: jest.fn() };
});
jest.mock('@proton/components/hooks/drawer/useDrawer', () => {
    return { __esModule: true, default: jest.fn() };
});
jest.mock('@proton/components/hooks/useApiStatus', () => {
    return { __esModule: true, default: jest.fn() };
});
jest.mock('@proton/components/hooks/useOnline', () => {
    return { __esModule: true, default: jest.fn() };
});
jest.mock('../../store/hooks', () => {
    return { useMailSelector: jest.fn() };
});
jest.mock('../../lumo/floating/useLumoHotkey', () => {
    return { useLumoHotkey: jest.fn() };
});
jest.mock('@proton/app-context/useApi', () => {
    return { useApi: jest.fn() };
});
jest.mock('@proton/shared/lib/helpers/metrics', () => {
    return { sendTelemetryReport: jest.fn() };
});

const user = buildUser();
const storageKey = `lumo-in-mail-enabled-${user.ID}`;
const createNotification = jest.fn();

const getToggle = () => {
    return screen.getByTestId<HTMLInputElement>('mail-quick-settings:lumo-toggle');
};

describe('LumoInMailToggle', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        jest.mocked(useUser).mockReturnValue([user, false]);
        mockUseNotifications({ createNotification });
        mockUseConfig();
        jest.mocked(useFlag).mockReturnValue(true);
        jest.mocked(useDrawer).mockReturnValue({
            appInView: undefined,
            toggleDrawerApp: jest.fn(),
        } as unknown as ReturnType<typeof useDrawer>);
        jest.mocked(useApiStatus).mockReturnValue(defaultApiStatus);
        jest.mocked(useOnline).mockReturnValue(true);
        jest.mocked(useMailSelector).mockReturnValue(0);
    });

    it('is on when nothing is stored', () => {
        render(<LumoInMailToggle id="toggle" />);

        expect(getToggle()).toBeChecked();
    });

    it('is off when the user turned Lumo off', () => {
        localStorage.setItem(storageKey, 'false');

        render(<LumoInMailToggle id="toggle" />);

        expect(getToggle()).not.toBeChecked();
    });

    it('turns Lumo off, confirms it and reports the disable once', () => {
        render(<LumoInMailToggle id="toggle" />);

        fireEvent.click(getToggle());

        expect(localStorage.getItem(storageKey)).toBe('false');
        expect(createNotification).toHaveBeenCalledWith({ text: 'Lumo assistant disabled' });
        expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
        expect(sendTelemetryReport).toHaveBeenCalledWith(
            expect.objectContaining({
                measurementGroup: TelemetryMeasurementGroups.mailLumo,
                event: 'assistant_disabled',
            })
        );
    });

    it('turns Lumo back on without reporting', () => {
        localStorage.setItem(storageKey, 'false');
        render(<LumoInMailToggle id="toggle" />);

        fireEvent.click(getToggle());

        expect(localStorage.getItem(storageKey)).toBe('true');
        expect(createNotification).toHaveBeenCalledWith({ text: 'Lumo assistant enabled' });
        expect(sendTelemetryReport).not.toHaveBeenCalled();
    });

    it('keeps what the Lumo provider wraps mounted while Lumo is turned off and back on', () => {
        const onMount = jest.fn();
        const MountProbe = () => {
            useEffect(onMount, []);
            return null;
        };
        render(
            <LumoFloatingPanelProvider>
                <LumoInMailToggle id="toggle" />
                <MountProbe />
            </LumoFloatingPanelProvider>
        );

        fireEvent.click(getToggle());
        fireEvent.click(getToggle());

        expect(getToggle()).toBeChecked();
        expect(onMount).toHaveBeenCalledTimes(1);
    });
});
