import { useFlag } from '@unleash/proxy-client-react';

import { useConfig, useFeature, useOrganization, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

import { FeatureCode } from '../../features';
import { useOrganizationTheme } from './useOrganizationTheme';

export const useShowLightLabellingFeatureModal = () => {
    const { APP_NAME } = useConfig();
    const [{ isAdmin }] = useUser();
    const [organization] = useOrganization();
    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';
    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const organizationTheme = useOrganizationTheme();
    const [welcomeFlags] = useWelcomeFlags();
    const isLightLabellingFeatureModalEnabled = useFlag('LightLabellingFeatureModal');

    const seenLightLabellingFeatureModal = useFeature<boolean>(FeatureCode.SeenLightLabellingFeatureModal);

    const hasOrganizationUsage = organization && organization.UsedDomains >= 1 && organization.UsedMembers >= 2;

    if (
        ((APP_NAME !== APPS.PROTONACCOUNT && welcomeFlags.isDone) || APP_NAME === APPS.PROTONACCOUNT) &&
        hasOrganizationKey &&
        isLightLabellingFeatureModalEnabled &&
        seenLightLabellingFeatureModal.feature?.Value === false &&
        !isPartOfFamily &&
        isAdmin &&
        hasOrganizationUsage &&
        organizationTheme.access &&
        !organizationTheme.logoURL
    ) {
        return true;
    }

    return false;
};
