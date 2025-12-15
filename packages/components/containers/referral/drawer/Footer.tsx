import { c } from 'ttag';

import QuickSettingsButton from '@proton/components/components/drawer/views/quickSettings/QuickSettingsButton';
import QuickSettingsButtonSection from '@proton/components/components/drawer/views/quickSettings/QuickSettingsButtonSection';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';

import { useReferralDiscover } from '../hooks/useReferralDiscover';

const Footer = () => {
    const { onDrawerAppDismiss } = useReferralDiscover();
    const { setAppInView } = useDrawer();

    const handleDismiss = () => {
        onDrawerAppDismiss();
        setAppInView(undefined);
    };

    return (
        <QuickSettingsButtonSection>
            <QuickSettingsButton onClick={handleDismiss}>{c('Label').t`Don't show this again`}</QuickSettingsButton>
        </QuickSettingsButtonSection>
    );
};

export default Footer;
