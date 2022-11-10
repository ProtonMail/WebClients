import getIsProtonMailDomain from '@proton/shared/lib/browser/getIsProtonMailDomain';

import { FeatureCode } from '../containers';
import useFeature from './useFeature';

export default function useIsProtonMailDomainMigrationEnabled() {
    const isProtonMailDomain = getIsProtonMailDomain();
    const { feature, loading } = useFeature<boolean>(FeatureCode.ProtonMailDomainMigrationEnabled);

    const isProtonMailDomainMigrationEnabled = isProtonMailDomain && feature?.Value === true;

    return [isProtonMailDomainMigrationEnabled, loading] as const;
}
