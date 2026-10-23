import { renderHook } from '@testing-library/react';

import useLumoInMail from '@proton/components/components/drawer/views/lumoAgent/useLumoInMail';
import useDisplayFeatureTourDrawerButton from '@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import type { OrganizationSettingsAllowedProduct } from '@proton/shared/lib/interfaces/Organization';

import LumoSidebarButton from '../../components/drawer/LumoSidebarButton';
import useMailDrawer from './useMailDrawer';

jest.mock('@proton/components/components/drawer/views/lumoAgent/useLumoInMail', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@proton/components/containers/organization/accessControl/useAllowedProducts', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({ __esModule: true, default: jest.fn() }));

beforeEach(() => {
    jest.mocked(useDrawer).mockReturnValue({
        appInView: undefined,
        showDrawerSidebar: true,
    } as unknown as ReturnType<typeof useDrawer>);
    jest.mocked(useAllowedProducts).mockReturnValue([new Set<OrganizationSettingsAllowedProduct>(), false]);
    jest.mocked(useDisplayFeatureTourDrawerButton).mockReturnValue(false);
});

describe('useMailDrawer', () => {
    it('puts Lumo first in the Drawer sidebar when Lumo in Mail is on', () => {
        jest.mocked(useLumoInMail).mockReturnValue(true);

        const { result } = renderHook(() => useMailDrawer());

        expect(result.current.drawerSidebarButtons[0].type).toBe(LumoSidebarButton);
    });

    it('leaves Lumo out of the Drawer sidebar when Lumo in Mail is off', () => {
        jest.mocked(useLumoInMail).mockReturnValue(false);

        const { result } = renderHook(() => useMailDrawer());

        expect(result.current.drawerSidebarButtons.map((button) => button.type)).not.toContain(LumoSidebarButton);
    });
});
