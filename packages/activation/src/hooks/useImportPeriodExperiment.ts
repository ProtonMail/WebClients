import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

import type { BYOEImportPeriodVariant } from '../telemetry/byoeCreationFunnel';

/** Import period experiment of the BYOE connection modal: whether the user sees the period selector, and their arm */
export const useImportPeriodExperiment = () => {
    const isImportPeriodEnabled = useFlag('InboxBringYourOwnEmailImportPeriod');
    const importVariant = useVariant('InboxBringYourOwnEmailImportPeriodExperiment');

    const getVariant = (): BYOEImportPeriodVariant => {
        if (!isImportPeriodEnabled) {
            return 'n/a';
        }
        if (importVariant.name === 'Treatment') {
            return 'treatment';
        }
        return importVariant.name === 'Control' ? 'control' : 'n/a';
    };
    const variant = getVariant();

    return { isImportPeriodEnabled, seeImportTimeline: variant === 'treatment', variant };
};
