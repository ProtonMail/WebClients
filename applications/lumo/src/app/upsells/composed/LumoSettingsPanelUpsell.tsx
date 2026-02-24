import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import GetLumoPlusButton from '../primitives/GetLumoPlusButton';
import { SubscriptionPanel } from '../primitives/SubscriptionPanel';
import useLumoPlusUpsellConfig from '../useLumoPlusUpsellButtonConfig';

export const LumoSettingsPanelUpsell = ({ feature = LUMO_UPSELL_PATHS.SETTINGS_MODAL }) => {
    const config = useLumoPlusUpsellConfig(feature);
    console.log('debug: config', config);

    const showUpsellPanel = config?.showInSettingsModal;

    if (!showUpsellPanel) return null;

    return (
        <SubscriptionPanel>
            <GetLumoPlusButton path={config?.path} onClick={config?.onUpgrade} className={config?.className} />
        </SubscriptionPanel>
    );
};

LumoSettingsPanelUpsell.displayName = 'LumoSettingsPanelUpsell';
