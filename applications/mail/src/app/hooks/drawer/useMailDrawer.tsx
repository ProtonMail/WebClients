import CalendarDrawerClaimProtonAddressModal from '@proton/byoe/src/components/BYOEClaimProtonAddressModal/CalendarDrawerClaimProtonAddressModal';
import CalendarDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/CalendarDrawerAppButton';
import ContactDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/ContactDrawerAppButton';
import ReferralAppButton from '@proton/components/components/drawer/drawerAppButtons/ReferralAppButton';
import SecurityCenterDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/SecurityCenterDrawerAppButton';
import VPNDrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/VPNDrawerAppButton';
import useDisplayFeatureTourDrawerButton from '@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import FeatureTourDrawerButton from '../../components/drawer/FeatureTourDrawerButton';
import LumoSidebarButton from '../../components/drawer/LumoSidebarButton';
import { useHasLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';
import { useMailDispatch, useMailSelector } from '../../store/hooks';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectAliasSpotlightDue } from '../../store/layout/layoutSliceSelectors';

const useMailDrawer = () => {
    const { appInView, showDrawerSidebar } = useDrawer();
    const canShowFeatureTourDrawerButton = useDisplayFeatureTourDrawerButton();
    const hasLumo = useHasLumoFloatingPanel();
    const dispatch = useMailDispatch();
    const aliasSpotlightDue = useMailSelector(selectAliasSpotlightDue);
    // No prefetch: this only writes, the value is read when the inbox cleanup's success window closes
    const { update: updateAliasSpotlight } = useFeature(FeatureCode.BYOEInboxCleanupAliasSpotlight, false);

    const [allowedProducts, loadingAllowedProducts] = useAllowedProducts();

    const drawerSidebarButtons = [
        hasLumo && <LumoSidebarButton />,
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
        allowedProducts.has(Product.Calendar) && (
            <CalendarDrawerAppButton
                aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
                ClaimProtonAddressModal={CalendarDrawerClaimProtonAddressModal}
                disabled={loadingAllowedProducts}
            />
        ),
        <SecurityCenterDrawerAppButton
            aria-expanded={isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView)}
            showAliasSpotlight={aliasSpotlightDue}
            onAliasSpotlightClose={() => {
                dispatch(layoutActions.setAliasSpotlightDue(false));
            }}
            onAliasSpotlightDisplayed={() => {
                // Shown once ever: it's only offered while this is still true
                updateAliasSpotlight(false).catch(noop);
            }}
        />,
        <VPNDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.VPN, appInView)} />,
        <ReferralAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.REFERRAL, appInView)} />,
        canShowFeatureTourDrawerButton && <FeatureTourDrawerButton />,
    ].filter(isTruthy);

    return { drawerSidebarButtons, showDrawerSidebar };
};

export default useMailDrawer;
