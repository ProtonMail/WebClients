import { act, renderHook } from '@testing-library/react';

import SecurityCenterDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/SecurityCenterDrawerAppButton';
import useDisplayFeatureTourDrawerButton from '@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { OrganizationSettingsAllowedProduct } from '@proton/shared/lib/interfaces/Organization';

import LumoSidebarButton from '../../components/drawer/LumoSidebarButton';
import { getStoreWrapper } from '../../helpers/tests/render';
import { useHasLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectAliasSpotlightDue } from '../../store/layout/layoutSliceSelectors';
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
vi.mock('@proton/features/useFeature', () => ({ __esModule: true, default: vi.fn() }));

const updateFeature = vi.fn();

beforeEach(() => {
    vi.mocked(useDrawer).mockReturnValue({
        appInView: undefined,
        showDrawerSidebar: true,
    } as unknown as ReturnType<typeof useDrawer>);
    vi.mocked(useAllowedProducts).mockReturnValue([new Set<OrganizationSettingsAllowedProduct>(), false]);
    vi.mocked(useDisplayFeatureTourDrawerButton).mockReturnValue(false);
    updateFeature.mockReset().mockResolvedValue(undefined);
    vi.mocked(useFeature).mockReturnValue({ update: updateFeature } as unknown as ReturnType<typeof useFeature>);
});

const renderMailDrawer = () => {
    const { Wrapper, store } = getStoreWrapper({});
    const view = renderHook(() => useMailDrawer(), { wrapper: Wrapper });
    const getSecurityCenterButton = () => {
        const button = view.result.current.drawerSidebarButtons.find(
            (element) => element.type === SecurityCenterDrawerAppButton
        );
        if (!button) {
            throw new Error('Security center button not found');
        }
        return button;
    };
    return { ...view, store, getSecurityCenterButton };
};

describe('useMailDrawer', () => {
    it('puts Lumo first in the Drawer sidebar once the Lumo panel state is published', () => {
        vi.mocked(useHasLumoFloatingPanel).mockReturnValue(true);

        const { result } = renderMailDrawer();

        expect(result.current.drawerSidebarButtons[0].type).toBe(LumoSidebarButton);
    });

    it('leaves Lumo out of the Drawer sidebar while there is no Lumo panel state, as when Lumo is off', () => {
        vi.mocked(useHasLumoFloatingPanel).mockReturnValue(false);

        const { result } = renderMailDrawer();

        expect(result.current.drawerSidebarButtons.map((button) => button.type)).not.toContain(LumoSidebarButton);
    });

    it('passes showAliasSpotlight false by default', () => {
        const { getSecurityCenterButton } = renderMailDrawer();

        expect(getSecurityCenterButton().props.showAliasSpotlight).toBe(false);
    });

    it('passes true once the layout flag is set', () => {
        const { store, getSecurityCenterButton } = renderMailDrawer();

        act(() => {
            store.dispatch(layoutActions.setAliasSpotlightDue(true));
        });

        expect(getSecurityCenterButton().props.showAliasSpotlight).toBe(true);
    });

    it('onAliasSpotlightDisplayed records that the alias spotlight has shown, so it never shows again', () => {
        const { getSecurityCenterButton } = renderMailDrawer();

        act(() => {
            getSecurityCenterButton().props.onAliasSpotlightDisplayed();
        });

        expect(useFeature).toHaveBeenCalledWith(FeatureCode.BYOEInboxCleanupAliasSpotlight, false);
        expect(updateFeature).toHaveBeenCalledTimes(1);
        expect(updateFeature).toHaveBeenCalledWith(false);
    });

    it('onAliasSpotlightClose clears the flag', () => {
        const { store, getSecurityCenterButton } = renderMailDrawer();
        act(() => {
            store.dispatch(layoutActions.setAliasSpotlightDue(true));
        });

        act(() => {
            getSecurityCenterButton().props.onAliasSpotlightClose();
        });

        expect(selectAliasSpotlightDue(store.getState())).toBe(false);
    });
});
