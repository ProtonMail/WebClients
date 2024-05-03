import { useFlag } from '@unleash/proxy-client-react';

import {
    useConfig,
    useFeature,
    useOrganization,
    useSubscription,
    useUser,
    useWelcomeFlags,
} from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { hasFamily } from '@proton/shared/lib/helpers/subscription';

import { FeatureCode } from '../../features';
import { useOrganizationTheme } from './useOrganizationTheme';

export const useShowLightLabellingFeatureModal = () => {
    const { APP_NAME } = useConfig();
    const [subscription] = useSubscription();
    const [{ isAdmin }] = useUser();
    const isPartOfFamily = hasFamily(subscription);
    const [organization] = useOrganization();
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const organizationTheme = useOrganizationTheme();
    const [welcomeFlags] = useWelcomeFlags();
    const isLightLabellingFeatureModalEnabled = useFlag('LightLabellingFeatureModal');

    const seenLightLabellingFeatureModal = useFeature<boolean>(FeatureCode.SeenLightLabellingFeatureModal);

    if (
        ((APP_NAME !== APPS.PROTONACCOUNT && welcomeFlags.isDone) || APP_NAME === APPS.PROTONACCOUNT) &&
        hasOrganizationKey &&
        isLightLabellingFeatureModalEnabled &&
        seenLightLabellingFeatureModal.feature?.Value === false &&
        !isPartOfFamily &&
        isAdmin &&
        organizationTheme.access &&
        !organizationTheme.logoURL
    ) {
        return true;
    }

    return false;
};
