import { selectIsDelegatedAccessSupported } from '../../delegatedAccess';
import { selectEnrichedOutgoingDelegatedAccess } from '../../delegatedAccess/shared/outgoing/selector';
import { selectPasswordReminder } from '../../passwordReminder';
import { selectAccountRecovery } from '../../recovery/accountRecovery';
import { selectMnemonicData } from '../../recovery/mnemonic';
import { selectRecoveryFileData } from '../../recovery/recoveryFile';
import { selectSessionRecoveryData } from '../../recovery/sessionRecoverySelectors';
import { selectUser } from '../../user';
import { selectUserSettings } from '../../userSettings';
import { getActionableActionItem } from '../components/getActionableActionItem';
import { type RecoveryItemIds, selectRecoveryState } from './recoveryState';

jest.mock('../../delegatedAccess', () => ({ selectIsDelegatedAccessSupported: jest.fn() }));
jest.mock('../../delegatedAccess/shared/outgoing/selector', () => ({
    selectEnrichedOutgoingDelegatedAccess: jest.fn(),
}));
jest.mock('../../passwordReminder', () => ({ selectPasswordReminder: jest.fn() }));
jest.mock('../../recovery/accountRecovery', () => ({ selectAccountRecovery: jest.fn() }));
jest.mock('../../recovery/mnemonic', () => ({ selectMnemonicData: jest.fn() }));
jest.mock('../../recovery/recoveryFile', () => ({ selectRecoveryFileData: jest.fn() }));
jest.mock('../../recovery/sessionRecoverySelectors', () => ({ selectSessionRecoveryData: jest.fn() }));
jest.mock('../../user', () => ({ selectUser: jest.fn() }));
jest.mock('../../userSettings', () => ({ selectUserSettings: jest.fn() }));

const setup = ({ delegatedAccessLoading = false }: { delegatedAccessLoading?: boolean } = {}) => {
    jest.mocked(selectUser).mockReturnValue({ value: { isPrivate: true } } as any);
    jest.mocked(selectUserSettings).mockReturnValue({ value: { Flags: { EdmOptOut: 0 } } } as any);
    jest.mocked(selectAccountRecovery).mockReturnValue({
        loading: false,
        // Password reset is set up, so the items gated behind it count toward the score.
        hasPerfectPasswordResetState: true,
        isAccountRecoveryAvailable: true,
        emailRecovery: { perfect: true, isVerified: true, hasReset: true, value: 'a@b.c' },
        phoneRecovery: { perfect: false, isVerified: false, hasReset: false, value: '' },
    } as any);
    jest.mocked(selectMnemonicData).mockReturnValue({
        loading: false,
        isMnemonicAvailable: true,
        isMnemonicSet: false,
    } as any);
    jest.mocked(selectRecoveryFileData).mockReturnValue({
        loading: false,
        isRecoveryFileAvailable: true,
        hasDeviceRecoveryEnabled: false,
        hasOutdatedRecoveryFile: false,
        recoverySecrets: [],
    } as any);
    jest.mocked(selectPasswordReminder).mockReturnValue({
        isAvailable: true,
        isEnabled: true,
        messageCadenceHasExpired: false,
    } as any);
    jest.mocked(selectSessionRecoveryData).mockReturnValue({
        isSessionRecoveryAvailable: true,
        isSessionRecoveryEnabled: false,
    } as any);
    jest.mocked(selectEnrichedOutgoingDelegatedAccess).mockReturnValue({
        isAvailable: true,
        loading: delegatedAccessLoading,
        emergencyContacts: { items: [], hasAccess: true, hasUpsell: false },
        recoveryContacts: { items: [] },
    } as any);
};

const getRecoveryState = (isDelegatedAccessSupported: boolean) => {
    jest.mocked(selectIsDelegatedAccessSupported).mockReturnValue(isDelegatedAccessSupported);
    // App support is baked into `isAvailable`, see `selectEnrichedOutgoingDelegatedAccess`.
    const outgoingDelegatedAccess = jest.mocked(selectEnrichedOutgoingDelegatedAccess)({} as any);
    jest.mocked(selectEnrichedOutgoingDelegatedAccess).mockReturnValue({
        ...outgoingDelegatedAccess,
        isAvailable: isDelegatedAccessSupported,
    });
    // The selector only reads state through the mocked input selectors.
    return selectRecoveryState({} as any);
};

const getItem = (state: ReturnType<typeof getRecoveryState>, id: RecoveryItemIds) => {
    return state.recoveryItems.find((item) => item.id === id);
};

const getActionableIds = (state: ReturnType<typeof getRecoveryState>) => {
    return state.recoveryActionItems.filter((item) => getActionableActionItem(item, new Map())).map((item) => item.id);
};

beforeEach(() => {
    jest.clearAllMocks();
    setup();
    selectRecoveryState.clearCache();
});

describe('selectRecoveryState', () => {
    describe('when delegated access is supported', () => {
        it('offers recovery contacts and emergency access', () => {
            const state = getRecoveryState(true);

            expect(getItem(state, 'recoveryContacts')?.isAvailable).toBe(true);
            expect(getItem(state, 'emergencyContacts')?.isAvailable).toBe(true);
            expect(getActionableIds(state)).toEqual(expect.arrayContaining(['recoveryContacts']));
        });
    });

    describe('when delegated access is not supported', () => {
        it('drops recovery contacts and emergency access from the recovery items', () => {
            const state = getRecoveryState(false);

            expect(getItem(state, 'recoveryContacts')?.isAvailable).toBe(false);
            expect(getItem(state, 'emergencyContacts')?.isAvailable).toBe(false);
        });

        it('has no delegated access steps left to action', () => {
            const actionableIds = getActionableIds(getRecoveryState(false));

            expect(actionableIds).not.toContain('recoveryContacts');
            expect(actionableIds).not.toContain('addEmergencyContacts');
            expect(actionableIds).not.toContain('upsellEmergencyContacts');
        });

        it('counts them as set up so that the maximum score stays reachable', () => {
            const supported = getRecoveryState(true);
            selectRecoveryState.clearCache();
            const unsupported = getRecoveryState(false);

            // Neither is enabled here, so both are pure gain over the app that can actually offer them.
            expect(unsupported.recoveryScore.score).toBe(supported.recoveryScore.score + 2);
        });

        it('reaches the maximum score once every offered option is enabled', () => {
            const state = getRecoveryState(false);
            const missing = state.recoveryItems
                .filter((item) => item.isAvailable && !item.isEnabled)
                .map((item) => item.id);

            // The two delegated access items must not be part of what's keeping the user from a perfect score.
            expect(missing).not.toContain('recoveryContacts');
            expect(missing).not.toContain('emergencyContacts');
            expect(state.recoveryScore.score + missing.length).toBe(state.recoveryScore.maxScore);
        });

        it('does not wait for the delegated access list to load', () => {
            setup({ delegatedAccessLoading: true });

            expect(getRecoveryState(false).loading).toBe(false);
            selectRecoveryState.clearCache();
            expect(getRecoveryState(true).loading).toBe(true);
        });
    });

    describe('when password verification is unavailable', () => {
        it('keeps the score baseline at 1 without offering it as a step', () => {
            const available = getRecoveryState(true);
            selectRecoveryState.clearCache();
            jest.mocked(selectPasswordReminder).mockReturnValue({
                isAvailable: false,
                isEnabled: false,
                messageCadenceHasExpired: false,
            } as any);
            const unavailable = getRecoveryState(true);

            expect(unavailable.recoveryScore.score).toBe(available.recoveryScore.score);
            expect(getActionableIds(unavailable)).not.toContain('passwordVerification');
        });
    });
});
