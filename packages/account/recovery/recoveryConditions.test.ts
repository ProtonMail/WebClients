import { FeatureCode } from '@proton/features/interface';

import {
    type RecoveryCondition,
    type RecoverySurface,
    deriveRecoveryConditions,
    getRecoveryIndicators,
    selectRecoveryConditions,
} from './recoveryConditions';

type RecoveryConditionsInput = Parameters<typeof deriveRecoveryConditions>[0];

const getInput = ({
    mnemonic,
    recoveryFile,
    ...rest
}: Partial<Omit<RecoveryConditionsInput, 'mnemonic' | 'recoveryFile'>> & {
    mnemonic?: Partial<RecoveryConditionsInput['mnemonic']>;
    recoveryFile?: Partial<RecoveryConditionsInput['recoveryFile']>;
} = {}): RecoveryConditionsInput => ({
    loading: false,
    overallStatus: 'incomplete',
    isDataRecoveryAvailable: true,
    isSentinelUser: false,
    hasKeysToReactivate: false,
    hasDismissedRecoverDataCard: false,
    mnemonic: {
        isMnemonicAvailable: true,
        isMnemonicSet: false,
        hasOutdatedMnemonic: false,
        mnemonicCanBeSet: true,
        ...mnemonic,
    },
    recoveryFile: { isRecoveryFileAvailable: true, hasOutdatedRecoveryFile: false, ...recoveryFile },
    ...rest,
});

describe('deriveRecoveryConditions', () => {
    it.each<[string, Parameters<typeof getInput>[0], RecoveryCondition[]]>([
        ['nothing while loading', { loading: true }, []],
        ['nothing when data recovery is unavailable', { isDataRecoveryAvailable: false }, []],
        ['nothing when recovery is complete', { overallStatus: 'complete' }, []],
        ['nothing when the phrase is set', { mnemonic: { isMnemonicSet: true, mnemonicCanBeSet: false } }, []],
        ['phrase-not-set when a phrase can be set', {}, ['phrase-not-set']],
        [
            'account-recovery-missing without a reset method when a phrase cannot be set',
            { mnemonic: { mnemonicCanBeSet: false } },
            ['account-recovery-missing'],
        ],
        [
            'data-recovery-missing with a reset method when a phrase cannot be set',
            { overallStatus: 'intermediate', mnemonic: { mnemonicCanBeSet: false } },
            ['data-recovery-missing'],
        ],
        [
            'only outdated-file when the file is outdated, not data-recovery-missing too',
            {
                overallStatus: 'intermediate',
                mnemonic: { mnemonicCanBeSet: false },
                recoveryFile: { hasOutdatedRecoveryFile: true },
            },
            ['outdated-file'],
        ],
        [
            'nothing when a reset method is set and files are unavailable',
            {
                overallStatus: 'intermediate',
                mnemonic: { mnemonicCanBeSet: false },
                recoveryFile: { isRecoveryFileAvailable: false },
            },
            [],
        ],
        [
            'only outdated-phrase when the phrase is outdated, without setup steps',
            { mnemonic: { hasOutdatedMnemonic: true, mnemonicCanBeSet: false } },
            ['outdated-phrase'],
        ],
        [
            'no outdated-phrase when the phrase is no longer available',
            { mnemonic: { isMnemonicAvailable: false, hasOutdatedMnemonic: true, mnemonicCanBeSet: false } },
            ['account-recovery-missing'],
        ],
        [
            'every condition, most important first',
            { hasKeysToReactivate: true, recoveryFile: { hasOutdatedRecoveryFile: true } },
            ['locked-data', 'outdated-file', 'phrase-not-set'],
        ],
        [
            'locked-data before an outdated phrase or file',
            {
                hasKeysToReactivate: true,
                mnemonic: { hasOutdatedMnemonic: true },
                recoveryFile: { hasOutdatedRecoveryFile: true },
            },
            ['locked-data', 'outdated-phrase', 'outdated-file'],
        ],
        [
            'locked-data while the recover data card is not dismissed',
            { hasKeysToReactivate: true, overallStatus: 'complete' },
            ['locked-data'],
        ],
        [
            'no locked-data once the recover data card is dismissed',
            { hasKeysToReactivate: true, overallStatus: 'complete', hasDismissedRecoverDataCard: true },
            [],
        ],
        [
            'no locked-data before the dismissed flag is loaded',
            { hasKeysToReactivate: true, overallStatus: 'complete', hasDismissedRecoverDataCard: undefined },
            [],
        ],
        [
            'sentinel-phrase-missing for Sentinel users without a phrase',
            { isSentinelUser: true, overallStatus: 'complete' },
            ['sentinel-phrase-missing'],
        ],
        ['nothing for Sentinel users with a phrase', { isSentinelUser: true, mnemonic: { isMnemonicSet: true } }, []],
    ])('gives %s', (_, input, expected) => {
        expect(deriveRecoveryConditions(getInput(input))).toEqual(expected);
    });
});

describe('getRecoveryIndicators', () => {
    const allConditions: RecoveryCondition[] = [
        'locked-data',
        'outdated-phrase',
        'outdated-file',
        'sentinel-phrase-missing',
        'phrase-not-set',
        'account-recovery-missing',
        'data-recovery-missing',
    ];

    const getConditions = (surface: RecoverySurface, options?: { hasSecurityCenter?: boolean }) =>
        getRecoveryIndicators(allConditions, surface, options).map(({ condition }) => condition);

    it('shows every condition in the sidebar, in order', () => {
        expect(getConditions('settingsSidebar')).toEqual(allConditions);
    });

    it('leaves out of quick settings what the security center already shows', () => {
        expect(getConditions('quickSettings', { hasSecurityCenter: true })).toEqual(['locked-data', 'outdated-phrase']);
        expect(getConditions('quickSettings')).toEqual(allConditions);
    });

    it('keeps everything in the sidebar next to a security center', () => {
        expect(getConditions('settingsSidebar', { hasSecurityCenter: true })).toEqual(allConditions);
    });

    it('gives urgent problems danger and setup steps warning', () => {
        expect(getRecoveryIndicators(allConditions, 'settingsSidebar')).toEqual([
            { condition: 'locked-data', kind: 'danger' },
            { condition: 'outdated-phrase', kind: 'danger' },
            { condition: 'outdated-file', kind: 'danger' },
            { condition: 'sentinel-phrase-missing', kind: 'danger' },
            { condition: 'phrase-not-set', kind: 'warning' },
            { condition: 'account-recovery-missing', kind: 'warning' },
            { condition: 'data-recovery-missing', kind: 'warning' },
        ]);
    });
});

describe('selectRecoveryConditions', () => {
    type RecoveryNotification = Parameters<typeof selectRecoveryConditions.resultFunc>[0];

    const recoveryNotification = {
        loading: false,
        overallStatus: 'complete',
        hasKeysToReactivate: true,
        dataRecovery: { isDataRecoveryAvailable: true },
        sentinelData: { isSentinelUser: false },
        mnemonicData: {
            isMnemonicAvailable: true,
            isMnemonicSet: false,
            hasOutdatedMnemonic: true,
            mnemonicCanBeSet: false,
        },
        recoveryFileData: { isRecoveryFileAvailable: true, hasOutdatedRecoveryFile: false },
    } as unknown as RecoveryNotification;

    it('derives the conditions from the recovery data and the dismissed flag', () => {
        expect(selectRecoveryConditions.resultFunc(recoveryNotification, false)).toEqual([
            'locked-data',
            'outdated-phrase',
        ]);
        expect(selectRecoveryConditions.resultFunc(recoveryNotification, true)).toEqual(['outdated-phrase']);
    });

    it('reads the dismissed flag from the features', () => {
        const [, selectHasDismissedRecoverDataCard] = selectRecoveryConditions.dependencies;
        const getState = (Value: boolean) =>
            ({ features: { [FeatureCode.DismissedRecoverDataCard]: { value: { Value } } } }) as unknown as Parameters<
                typeof selectHasDismissedRecoverDataCard
            >[0];

        expect(selectHasDismissedRecoverDataCard(getState(true))).toBe(true);
        expect(selectHasDismissedRecoverDataCard(getState(false))).toBe(false);
    });
});
