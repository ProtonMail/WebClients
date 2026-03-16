import { getIsOutgoingDelegatedAccessAvailable } from '@proton/account/delegatedAccess/available';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import useHasOutdatedRecoveryFile from '@proton/components/hooks/useHasOutdatedRecoveryFile';
import useIsMnemonicAvailable from '@proton/components/hooks/useIsMnemonicAvailable';
import useRecoverySecrets from '@proton/components/hooks/useRecoverySecrets';
import {
    useIsSessionRecoveryAvailable,
    useIsSessionRecoveryEnabled,
} from '@proton/components/hooks/useSessionRecovery';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/constants';
import {
    getIsPerfectDeviceRecoveryState,
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
} from '@proton/shared/lib/helpers/securityCheckup';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces/UserSettings';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';
import { useFlag } from '@proton/unleash/useFlag';
import clamp from '@proton/utils/clamp';

export type RecoveryScoreItemId =
    | 'email'
    | 'phone'
    | 'deviceRecovery'
    | 'recoveryFile'
    | 'recoveryContacts'
    | 'recoveryPhrase'
    | 'signedInReset'
    | 'qrCodeSignIn'
    | 'emergencyContacts'
    | 'passwordVerification';

export type RecoveryScoreItem = {
    id: RecoveryScoreItemId;
    isAvailable: boolean;
    isEnabled: boolean;
};

export type RecoveryScoreState = {
    securityState: SecurityState;
    recoveryFile: { isAvailable: boolean; isEnabled: boolean };
    recoveryContacts: { isAvailable: boolean; isEnabled: boolean };
    signedInReset: { isAvailable: boolean; isEnabled: boolean };
    qrCodeSignIn: { isAvailable: boolean; isEnabled: boolean };
    emergencyContacts: { isAvailable: boolean; isEnabled: boolean };
};

const MIN_SCORE = 0;
const MAX_SCORE = 10;

export const calculateRecoveryScore = (
    state: RecoveryScoreState
): { score: number; maxScore: number; scoreItems: RecoveryScoreItem[] } => {
    const emailEnabled = getIsPerfectEmailState(state.securityState);
    const phoneEnabled = getIsPerfectPhoneState(state.securityState);
    const hasPasswordResetOption = emailEnabled || phoneEnabled;

    const scoreItems: RecoveryScoreItem[] = [
        {
            id: 'email',
            isAvailable: true,
            isEnabled: emailEnabled,
        },
        {
            id: 'phone',
            isAvailable: true,
            isEnabled: phoneEnabled,
        },
        {
            id: 'deviceRecovery',
            isAvailable: hasPasswordResetOption && state.securityState.deviceRecovery.isAvailable,
            isEnabled: getIsPerfectDeviceRecoveryState(state.securityState),
        },
        {
            id: 'recoveryFile',
            isAvailable: hasPasswordResetOption && state.recoveryFile.isAvailable,
            isEnabled: state.recoveryFile.isEnabled,
        },
        {
            id: 'recoveryContacts',
            isAvailable: hasPasswordResetOption && state.recoveryContacts.isAvailable,
            isEnabled: state.recoveryContacts.isEnabled,
        },
        {
            id: 'recoveryPhrase',
            isAvailable: state.securityState.phrase.isAvailable,
            isEnabled: getIsPerfectPhraseState(state.securityState),
        },
        {
            id: 'signedInReset',
            isAvailable: state.signedInReset.isAvailable,
            isEnabled: state.signedInReset.isEnabled,
        },
        {
            id: 'qrCodeSignIn',
            isAvailable: state.qrCodeSignIn.isAvailable,
            isEnabled: state.qrCodeSignIn.isEnabled,
        },
        {
            id: 'emergencyContacts',
            isAvailable: state.emergencyContacts.isAvailable,
            isEnabled: state.emergencyContacts.isEnabled,
        },
        {
            id: 'passwordVerification',
            isAvailable: true,
            isEnabled: true, // password verification flow is not implemented yet
        },
    ];

    const availableOptions = scoreItems.filter((item) => item.isAvailable);
    const enabledOptions = availableOptions.filter((item) => item.isEnabled);
    const score = clamp(enabledOptions.length, MIN_SCORE, MAX_SCORE);

    return { score, maxScore: MAX_SCORE, scoreItems };
};

const useRecoveryScore = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const { items } = useOutgoingItems();
    const hasOutdatedRecoveryFile = useHasOutdatedRecoveryFile();
    const recoverySecrets = useRecoverySecrets();
    const [isMnemonicAvailable] = useIsMnemonicAvailable();
    const [isRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const isSessionRecoveryEnabled = useIsSessionRecoveryEnabled();
    const isRecoveryContactsEnabled = useFlag('SocialRecovery');
    const isOutgoingDelegatedAccessAvailable = getIsOutgoingDelegatedAccessAvailable(user);
    const isEmergencyAccessAvailable = user.isPrivate && isOutgoingDelegatedAccessAvailable;
    const isRecoveryContactsAvailable = isRecoveryContactsEnabled && isEmergencyAccessAvailable;
    // Keep the core recovery inputs aligned with SecurityCheckup's shared state shape
    // so this banner can migrate to that source of truth later
    const securityState: SecurityState = {
        phrase: {
            isAvailable: isMnemonicAvailable,
            isSet: user.MnemonicStatus === MNEMONIC_STATUS.SET,
            isOutdated: user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED,
        },
        email: {
            value: userSettings?.Email?.Value,
            isEnabled: !!userSettings?.Email?.Reset,
            verified: userSettings?.Email?.Status === SETTINGS_STATUS.VERIFIED,
        },
        phone: {
            value: userSettings?.Phone?.Value,
            isEnabled: !!userSettings?.Phone?.Reset,
            verified: userSettings?.Phone?.Status === SETTINGS_STATUS.VERIFIED,
        },
        deviceRecovery: {
            isAvailable: isRecoveryFileAvailable,
            isEnabled: !!userSettings?.DeviceRecovery,
        },
        hasSentinelEnabled: userSettings?.HighSecurity?.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
    };

    const recoveryScoreState: RecoveryScoreState = {
        securityState,
        recoveryFile: {
            isAvailable: isRecoveryFileAvailable,
            isEnabled: isRecoveryFileAvailable && !hasOutdatedRecoveryFile && recoverySecrets.length > 0,
        },
        recoveryContacts: {
            isAvailable: isRecoveryContactsAvailable,
            isEnabled: isRecoveryContactsAvailable && items.recoveryContacts.length > 0,
        },
        signedInReset: {
            isAvailable: isSessionRecoveryAvailable,
            isEnabled: isSessionRecoveryAvailable && isSessionRecoveryEnabled,
        },
        qrCodeSignIn: {
            isAvailable: true,
            isEnabled: !userSettings?.Flags.EdmOptOut,
        },
        emergencyContacts: {
            isAvailable: isEmergencyAccessAvailable,
            isEnabled: isEmergencyAccessAvailable && items.emergencyContacts.length > 0,
        },
    };

    const { score, maxScore, scoreItems } = calculateRecoveryScore(recoveryScoreState);

    return { score, maxScore, scoreItems, securityState };
};

export default useRecoveryScore;
