import { render } from '@testing-library/react';

import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { useLumoMailTelemetry } from '../telemetry/useLumoMailTelemetry';
import LumoDrawerHotkey from './LumoDrawerHotkey';
import { useLumoHotkey } from './useLumoHotkey';

jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../telemetry/useLumoMailTelemetry', () => ({ useLumoMailTelemetry: jest.fn() }));
jest.mock('./useLumoHotkey', () => ({ useLumoHotkey: jest.fn() }));

const assistantOpened = jest.fn();
const toggleLumoTab = jest.fn();
const toggleDrawerApp = jest.fn(() => toggleLumoTab);

const renderWithAppInView = (appInView: DRAWER_NATIVE_APPS | undefined) => {
    jest.mocked(useDrawer).mockReturnValue({ appInView, toggleDrawerApp } as unknown as ReturnType<typeof useDrawer>);
    jest.mocked(useLumoMailTelemetry).mockReturnValue({ assistantOpened } as unknown as ReturnType<
        typeof useLumoMailTelemetry
    >);
    render(<LumoDrawerHotkey />);
    return jest.mocked(useLumoHotkey).mock.lastCall![0];
};

beforeEach(() => jest.clearAllMocks());

describe('LumoDrawerHotkey', () => {
    it('treats the Lumo drawer tab as the open surface', () => {
        expect(renderWithAppInView(DRAWER_NATIVE_APPS.LUMO).isCurrentSurfaceOpen).toBe(true);
        expect(renderWithAppInView(DRAWER_NATIVE_APPS.CONTACTS).isCurrentSurfaceOpen).toBe(false);
    });

    it('opens the Lumo drawer tab and records the open', () => {
        renderWithAppInView(undefined).openLumo();

        expect(toggleDrawerApp).toHaveBeenCalledWith({ app: DRAWER_NATIVE_APPS.LUMO });
        expect(toggleLumoTab).toHaveBeenCalledTimes(1);
        expect(assistantOpened).toHaveBeenCalledTimes(1);
    });
});
