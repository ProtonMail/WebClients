import { renderHook } from '@testing-library/react';

import useDisplayFeatureTourDrawerButton from '@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import type { OrganizationSettingsAllowedProduct } from '@proton/shared/lib/interfaces/Organization';

import LumoSidebarButton from '../../components/drawer/LumoSidebarButton';
import { useHasLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';
import useMailDrawer from './useMailDrawer';

vi.mock('../../lumo/floating/LumoFloatingPanelProvider', async () => ({
    ...(await vi.importActual('../../lumo/floating/LumoFloatingPanelProvider')),
    useHasLumoFloatingPanel: vi.fn(),
}));
vi.mock('@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('@proton/components/containers/organization/accessControl/useAllowedProducts', () => ({
    __esModule: true,
    default: vi.fn(),
}));
vi.mock('@proton/components/hooks/drawer/useDrawer', () => ({ __esModule: true, default: vi.fn() }));

beforeEach(() => {
    vi.mocked(useDrawer).mockReturnValue({
        appInView: undefined,
        showDrawerSidebar: true,
    } as unknown as ReturnType<typeof useDrawer>);
    vi.mocked(useAllowedProducts).mockReturnValue([new Set<OrganizationSettingsAllowedProduct>(), false]);
    vi.mocked(useDisplayFeatureTourDrawerButton).mockReturnValue(false);
});

describe('useMailDrawer', () => {
    it('puts Lumo first in the Drawer sidebar once the Lumo panel state is published', () => {
        vi.mocked(useHasLumoFloatingPanel).mockReturnValue(true);

        const { result } = renderHook(() => useMailDrawer());

        expect(result.current.drawerSidebarButtons[0].type).toBe(LumoSidebarButton);
    });

    it('leaves Lumo out of the Drawer sidebar while there is no Lumo panel state, as when Lumo is off', () => {
        vi.mocked(useHasLumoFloatingPanel).mockReturnValue(false);

        const { result } = renderHook(() => useMailDrawer());

        expect(result.current.drawerSidebarButtons.map((button) => button.type)).not.toContain(LumoSidebarButton);
    });
});
