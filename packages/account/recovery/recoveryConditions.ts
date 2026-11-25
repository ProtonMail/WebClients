import { createSelector } from '@reduxjs/toolkit';

import { FeatureCode } from '@proton/features/interface';
import { type FeaturesReducerState, selectFeatures } from '@proton/features/reducer';

import type { selectMnemonicData } from './mnemonic';
import type { selectRecoveryFileData } from './recoveryFile';
import { type RecoveryStatus, selectRecoveryNotification } from './recoveryNotification';

/** Recovery problems that need the user's attention */
export type RecoveryCondition =
    | 'locked-data'
    | 'outdated-phrase'
    | 'outdated-file'
    | 'sentinel-phrase-missing'
    | 'phrase-not-set'
    | 'account-recovery-missing'
    | 'data-recovery-missing';

/** Places in the apps that show recovery indicators */
export type RecoverySurface = 'settingsSidebar' | 'quickSettings';

export type RecoveryIndicatorKind = 'danger' | 'warning';

interface RecoveryConditionConfig {
    kind: RecoveryIndicatorKind;
    /** Mail's security center already shows it, so surfaces next to the security center leave it out */
    shownInSecurityCenter?: boolean;
}

const recoveryConditionConfig: Record<RecoveryCondition, RecoveryConditionConfig> = {
    'locked-data': { kind: 'danger' },
    'outdated-phrase': { kind: 'danger' },
    'outdated-file': { kind: 'danger', shownInSecurityCenter: true },
    'sentinel-phrase-missing': { kind: 'danger', shownInSecurityCenter: true },
    'phrase-not-set': { kind: 'warning', shownInSecurityCenter: true },
    'account-recovery-missing': { kind: 'warning', shownInSecurityCenter: true },
    'data-recovery-missing': { kind: 'warning', shownInSecurityCenter: true },
};

const surfacesNextToSecurityCenter: RecoverySurface[] = ['quickSettings'];

interface RecoveryConditionsInput {
    loading: boolean;
    overallStatus: RecoveryStatus;
    isDataRecoveryAvailable: boolean;
    isSentinelUser: boolean;
    hasKeysToReactivate: boolean | undefined;
    hasDismissedRecoverDataCard: boolean | undefined;
    mnemonic: Pick<
        ReturnType<typeof selectMnemonicData>,
        'isMnemonicAvailable' | 'isMnemonicSet' | 'hasOutdatedMnemonic' | 'mnemonicCanBeSet'
    >;
    recoveryFile: Pick<
        ReturnType<typeof selectRecoveryFileData>,
        'isRecoveryFileAvailable' | 'hasOutdatedRecoveryFile'
    >;
}

/** The one recovery setup step still missing, if any */
const getSetupCondition = (
    { isSentinelUser, overallStatus, mnemonic, recoveryFile }: RecoveryConditionsInput,
    hasOutdatedFile: boolean
): RecoveryCondition | undefined => {
    // keeps account recovery notification dot consistent with mail security center for new recovery settings for sentinel users
    if (isSentinelUser) {
        return mnemonic.isMnemonicAvailable && !mnemonic.isMnemonicSet ? 'sentinel-phrase-missing' : undefined;
    }
    if (mnemonic.isMnemonicSet || overallStatus === 'complete') {
        return;
    }
    if (mnemonic.isMnemonicAvailable && mnemonic.mnemonicCanBeSet) {
        return 'phrase-not-set';
    }
    if (overallStatus === 'incomplete') {
        return 'account-recovery-missing';
    }
    // A reset method is set but there's no data recovery. An outdated file already has its own condition.
    if (recoveryFile.isRecoveryFileAvailable && !hasOutdatedFile) {
        return 'data-recovery-missing';
    }
};

/** The account's recovery conditions, most important first */
export const deriveRecoveryConditions = (input: RecoveryConditionsInput): RecoveryCondition[] => {
    if (input.loading || !input.isDataRecoveryAvailable) {
        return [];
    }

    const hasOutdatedPhrase = input.mnemonic.isMnemonicAvailable && input.mnemonic.hasOutdatedMnemonic;
    const hasOutdatedFile = input.recoveryFile.isRecoveryFileAvailable && input.recoveryFile.hasOutdatedRecoveryFile;
    const conditions: RecoveryCondition[] = [];

    // Locked data comes first: an outdated phrase or file may be what unlocks it, so it shouldn't be replaced before
    if (input.hasKeysToReactivate && input.hasDismissedRecoverDataCard === false) {
        conditions.push('locked-data');
    }
    if (hasOutdatedPhrase) {
        conditions.push('outdated-phrase');
    }
    if (hasOutdatedFile) {
        conditions.push('outdated-file');
    }

    // An outdated phrase supersedes the setup steps
    const setupCondition = hasOutdatedPhrase ? undefined : getSetupCondition(input, hasOutdatedFile);
    if (setupCondition) {
        conditions.push(setupCondition);
    }

    return conditions;
};

// Only this flag, so loading other features doesn't recompute the conditions
const selectHasDismissedRecoverDataCard = (state: FeaturesReducerState): boolean | undefined =>
    selectFeatures(state)[FeatureCode.DismissedRecoverDataCard]?.value.Value;

export const selectRecoveryConditions = createSelector(
    [selectRecoveryNotification, selectHasDismissedRecoverDataCard],
    (recoveryNotification, hasDismissedRecoverDataCard) =>
        deriveRecoveryConditions({
            loading: recoveryNotification.loading,
            overallStatus: recoveryNotification.overallStatus,
            isDataRecoveryAvailable: recoveryNotification.dataRecovery.isDataRecoveryAvailable,
            isSentinelUser: recoveryNotification.sentinelData.isSentinelUser,
            hasKeysToReactivate: recoveryNotification.hasKeysToReactivate,
            hasDismissedRecoverDataCard,
            mnemonic: recoveryNotification.mnemonicData,
            recoveryFile: recoveryNotification.recoveryFileData,
        })
);

export interface RecoveryIndicator {
    condition: RecoveryCondition;
    kind: RecoveryIndicatorKind;
}

/** The indicators a surface shows for the given conditions, in the conditions' order */
export const getRecoveryIndicators = (
    conditions: RecoveryCondition[],
    surface: RecoverySurface,
    { hasSecurityCenter = false }: { hasSecurityCenter?: boolean } = {}
): RecoveryIndicator[] => {
    const isNextToSecurityCenter = hasSecurityCenter && surfacesNextToSecurityCenter.includes(surface);

    return conditions.flatMap((condition) => {
        const { kind, shownInSecurityCenter } = recoveryConditionConfig[condition];
        if (isNextToSecurityCenter && shownInSecurityCenter) {
            return [];
        }
        return [{ condition, kind }];
    });
};
