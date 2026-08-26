import { createSelector } from '@reduxjs/toolkit';

import { selectIsDelegatedAccessSupported } from '../../delegatedAccess';
import { selectEnrichedOutgoingDelegatedAccess } from '../../delegatedAccess/shared/outgoing/selector';
import { selectPasswordReminder } from '../../passwordReminder';
import { selectAccountRecovery } from '../../recovery/accountRecovery';
import { selectMnemonicData } from '../../recovery/mnemonic';
import { selectRecoveryFileData } from '../../recovery/recoveryFile';
import { selectSessionRecoveryData } from '../../recovery/sessionRecoverySelectors';
import { selectUser } from '../../user';
import { selectUserSettings } from '../../userSettings';
import { type RecoveryScore, calculateRecoveryScore } from '../recoveryScore/calculateRecoveryScore';
import { getSafetyReviewRecoveryState } from '../telemetry/getSafetyReviewRecoveryState';
import { type SafetyReviewCohort, getCohort } from '../telemetry/utils/getCohort';

type GenericRecoveryItem<T extends string> = {
    id: T;
    isAvailable: boolean;
    isEnabled: boolean;
    /** Omitted or true: counts toward the score. False: gated until recovery email or SMS is configured. */
    countsTowardScore?: boolean;
};

export type RecoveryItems = [
    GenericRecoveryItem<'passwordVerification'>,
    GenericRecoveryItem<'recoveryEmail'> & {
        data: { isVerified: boolean; hasValue: boolean; hasReset: boolean; value: string };
    },
    GenericRecoveryItem<'recoveryPhone'> & {
        data: { isVerified: boolean; hasValue: boolean; hasReset: boolean; value: string };
    },
    GenericRecoveryItem<'deviceRecovery'>,
    GenericRecoveryItem<'recoveryContacts'>,
    GenericRecoveryItem<'recoveryPhrase'>,
    GenericRecoveryItem<'signedInReset'>,
    GenericRecoveryItem<'qrCodeSignIn'>,
    GenericRecoveryItem<'recoveryFile'>,
    GenericRecoveryItem<'emergencyContacts'>,
];

export type RecoveryItemIds = RecoveryItems[number]['id'];
export type RecoveryItem = RecoveryItems[number];

type GenericRecoveryActionItem<T extends string, RecoveryItemIdType extends RecoveryItemIds> = {
    id: T;
    recoveryItem: Extract<RecoveryItem, { id: RecoveryItemIdType }>;
};

type RecoveryActionItems = [
    GenericRecoveryActionItem<'passwordVerification', 'passwordVerification'>,
    GenericRecoveryActionItem<'setRecoveryEmail', 'recoveryEmail'>,
    GenericRecoveryActionItem<'verifyRecoveryEmail', 'recoveryEmail'>,
    GenericRecoveryActionItem<'enableRecoveryEmail', 'recoveryEmail'>,
    GenericRecoveryActionItem<'setRecoveryPhone', 'recoveryPhone'>,
    GenericRecoveryActionItem<'verifyRecoveryPhone', 'recoveryPhone'>,
    GenericRecoveryActionItem<'enableRecoveryPhone', 'recoveryPhone'>,
    GenericRecoveryActionItem<'deviceRecovery', 'deviceRecovery'>,
    GenericRecoveryActionItem<'recoveryFile', 'recoveryFile'>,
    GenericRecoveryActionItem<'recoveryContacts', 'recoveryContacts'>,
    GenericRecoveryActionItem<'recoveryPhrase', 'recoveryPhrase'>,
    GenericRecoveryActionItem<'signedInReset', 'signedInReset'>,
    GenericRecoveryActionItem<'qrCodeSignIn', 'qrCodeSignIn'>,
    GenericRecoveryActionItem<'upsellEmergencyContacts', 'emergencyContacts'>,
    GenericRecoveryActionItem<'addEmergencyContacts', 'emergencyContacts'>,
];
export type RecoveryActionItemsIds = RecoveryActionItems[number]['id'];

export type RecoveryActionItem = RecoveryActionItems[number];
export type ExtractRecoveryActionItem<T extends RecoveryActionItemsIds> = Extract<RecoveryActionItem, { id: T }>;

export type RecoveryStateResult = {
    recoveryItems: RecoveryItems;
    recoveryActionItems: RecoveryActionItem[];
    recoveryScore: RecoveryScore;
    loading: boolean;
    cohort: SafetyReviewCohort | undefined;
};

export const selectRecoveryState = createSelector(
    [
        selectUser,
        selectUserSettings,
        selectAccountRecovery,
        selectMnemonicData,
        selectRecoveryFileData,
        selectPasswordReminder,
        selectSessionRecoveryData,
        selectEnrichedOutgoingDelegatedAccess,
        selectIsDelegatedAccessSupported,
    ],
    (
        { value: user },
        { value: userSettings },
        accountRecoveryData,
        mnemonicData,
        recoveryFileData,
        passwordReminder,
        sessionRecoveryData,
        outgoingDelegatedAccess,
        isDelegatedAccessSupported
    ): RecoveryStateResult => {
        // `isAvailable` already accounts for app support, see `selectEnrichedOutgoingDelegatedAccess`.
        const isEmergencyAccessAvailable = outgoingDelegatedAccess.isAvailable;
        const isRecoveryContactsAvailable = outgoingDelegatedAccess.isAvailable;

        const hasPerfectPasswordResetState = accountRecoveryData.hasPerfectPasswordResetState;
        // These recovery methods can only be used after a password reset has been performed.
        const itemsThatRequirePasswordReset: RecoveryItemIds[] = ['recoveryFile', 'deviceRecovery', 'recoveryContacts'];

        const recoveryItems: RecoveryItems = [
            {
                id: 'passwordVerification',
                isAvailable: passwordReminder.isAvailable && passwordReminder.isEnabled,
                isEnabled: !passwordReminder.messageCadenceHasExpired,
            },
            {
                id: 'recoveryEmail',
                isAvailable: accountRecoveryData.isAccountRecoveryAvailable,
                isEnabled: accountRecoveryData.emailRecovery.perfect,
                data: {
                    isVerified: accountRecoveryData.emailRecovery.isVerified,
                    hasValue: !!accountRecoveryData.emailRecovery.value,
                    hasReset: accountRecoveryData.emailRecovery.hasReset,
                    value: accountRecoveryData.emailRecovery.value,
                },
            },
            {
                id: 'recoveryPhone',
                isAvailable: accountRecoveryData.isAccountRecoveryAvailable,
                isEnabled: accountRecoveryData.phoneRecovery.perfect,
                data: {
                    isVerified: accountRecoveryData.phoneRecovery.isVerified,
                    hasValue: !!accountRecoveryData.phoneRecovery.value,
                    hasReset: accountRecoveryData.phoneRecovery.hasReset,
                    value: accountRecoveryData.phoneRecovery.value,
                },
            },
            {
                id: 'deviceRecovery',
                isAvailable: recoveryFileData.isRecoveryFileAvailable,
                isEnabled: recoveryFileData.hasDeviceRecoveryEnabled,
                countsTowardScore: hasPerfectPasswordResetState,
            },
            {
                id: 'recoveryContacts',
                isAvailable: isRecoveryContactsAvailable,
                isEnabled: isRecoveryContactsAvailable && outgoingDelegatedAccess.recoveryContacts.items.length > 0,
                countsTowardScore: hasPerfectPasswordResetState,
            },
            {
                id: 'recoveryPhrase',
                isAvailable: mnemonicData.isMnemonicAvailable,
                isEnabled: mnemonicData.isMnemonicSet,
            },
            {
                id: 'signedInReset',
                isAvailable: sessionRecoveryData.isSessionRecoveryAvailable,
                isEnabled:
                    sessionRecoveryData.isSessionRecoveryAvailable && sessionRecoveryData.isSessionRecoveryEnabled,
            },
            {
                id: 'qrCodeSignIn',
                isAvailable: true,
                isEnabled: !userSettings?.Flags.EdmOptOut,
            },
            {
                id: 'recoveryFile',
                isAvailable: recoveryFileData.isRecoveryFileAvailable,
                isEnabled:
                    recoveryFileData.isRecoveryFileAvailable &&
                    !recoveryFileData.hasOutdatedRecoveryFile &&
                    recoveryFileData.recoverySecrets.length > 0,
                countsTowardScore: hasPerfectPasswordResetState,
            },
            {
                id: 'emergencyContacts',
                isAvailable: isEmergencyAccessAvailable,
                isEnabled: isEmergencyAccessAvailable && outgoingDelegatedAccess.emergencyContacts.items.length > 0,
            },
        ];

        const recoveryActionItems = recoveryItems.flatMap((recoveryItem): RecoveryActionItem[] => {
            const items: RecoveryActionItem[] = [];
            // Tweak recovery into multiple actionable steps.
            if (recoveryItem.id === 'recoveryEmail') {
                items.push({
                    id: 'setRecoveryEmail',
                    recoveryItem: { ...recoveryItem, isEnabled: recoveryItem.data.hasValue },
                });
                items.push({
                    id: 'verifyRecoveryEmail',
                    recoveryItem: {
                        ...recoveryItem,
                        isAvailable: recoveryItem.isAvailable && recoveryItem.data.hasValue,
                        isEnabled: recoveryItem.data.isVerified,
                    },
                });
                items.push({
                    id: 'enableRecoveryEmail',
                    recoveryItem: {
                        ...recoveryItem,
                        isAvailable: recoveryItem.isAvailable && recoveryItem.data.hasValue,
                        isEnabled: recoveryItem.data.hasReset,
                    },
                });
                return items;
            }
            if (recoveryItem.id === 'recoveryPhone') {
                items.push({
                    id: 'setRecoveryPhone',
                    recoveryItem: { ...recoveryItem, isEnabled: recoveryItem.data.hasValue },
                });
                items.push({
                    id: 'verifyRecoveryPhone',
                    recoveryItem: {
                        ...recoveryItem,
                        isAvailable: recoveryItem.isAvailable && recoveryItem.data.hasValue,
                        isEnabled: recoveryItem.data.isVerified,
                    },
                });
                items.push({
                    id: 'enableRecoveryPhone',
                    recoveryItem: {
                        ...recoveryItem,
                        isAvailable: recoveryItem.isAvailable && recoveryItem.data.hasValue,
                        isEnabled: recoveryItem.data.hasReset,
                    },
                });
                return items;
            }
            if (recoveryItem.id === 'emergencyContacts') {
                items.push({
                    id: 'upsellEmergencyContacts',
                    recoveryItem: {
                        ...recoveryItem,
                        isAvailable: recoveryItem.isAvailable && outgoingDelegatedAccess.emergencyContacts.hasUpsell,
                    },
                });
                items.push({
                    id: 'addEmergencyContacts',
                    recoveryItem: {
                        ...recoveryItem,
                        isAvailable: recoveryItem.isAvailable && outgoingDelegatedAccess.emergencyContacts.hasAccess,
                    },
                });
                return items;
            }
            // Skip these items if password reset is not enabled
            if (
                !hasPerfectPasswordResetState &&
                itemsThatRequirePasswordReset.some((value) => value === recoveryItem.id)
            ) {
                return [
                    {
                        id: recoveryItem.id,
                        recoveryItem: {
                            ...recoveryItem,
                            isAvailable: false,
                        },
                    },
                ] as RecoveryActionItem[];
            }
            return [{ id: recoveryItem.id, recoveryItem }] as RecoveryActionItem[];
        });

        const recoveryScore = calculateRecoveryScore(
            recoveryItems.map((item): RecoveryItem => {
                // If password reminder is available, use the recovery item as is. Remove after FF is enabled.
                if (item.id === 'passwordVerification' && !passwordReminder.isAvailable) {
                    return {
                        ...item,
                        // Pretend that passwordVerification is available for the recovery score computation
                        // to have the baseline be at 1.
                        // This ensures it's not available as an action item because that's not supported in either the FE or BE.
                        isAvailable: true,
                        isEnabled: true,
                    };
                }
                if (
                    !isDelegatedAccessSupported &&
                    (item.id === 'recoveryContacts' || item.id === 'emergencyContacts')
                ) {
                    return {
                        ...item,
                        // Same idea for delegated access: the app can't offer it at all, so pretend both options are
                        // set up to keep the maximum score reachable, while staying unavailable as action items.
                        isAvailable: true,
                        isEnabled: true,
                        countsTowardScore: true,
                    };
                }
                return item;
            })
        );

        const loading =
            !user ||
            !userSettings ||
            mnemonicData.loading ||
            // Only wait for the delegated access list when it can actually contribute to the state. When it's
            // unavailable the recovery/emergency contact items are disabled regardless of what the list contains,
            // and nothing is guaranteed to fetch it, so waiting would never resolve.
            (outgoingDelegatedAccess.isAvailable && outgoingDelegatedAccess.loading) ||
            recoveryFileData.loading ||
            accountRecoveryData.loading;

        const cohort = loading
            ? undefined
            : getCohort(
                  getSafetyReviewRecoveryState({
                      accountRecovery: accountRecoveryData,
                      mnemonicData,
                      recoveryFileData,
                      outgoingDelegatedAccess,
                  })
              );

        return {
            loading,
            recoveryScore,
            recoveryItems,
            recoveryActionItems,
            cohort,
        };
    }
);

/** Sentinel overview banner: which recovery-state-driven message to show (or hide). */
export type SentinelRecoveryBannerVariant = 'disable-recovery-options' | 'download-recovery-phrase' | null;

/**
 * Recovery settings that Sentinel treats as conflicts match the highlighted rows in account recovery (email/SMS
 * recovery path on, device backup, recovery file, contacts, signed-in reset, QR sign-in, emergency access).
 */
export const selectSentinelRecoveryBannerDisplay = createSelector(
    [selectRecoveryState, selectAccountRecovery],
    (recoveryState, accountRecovery): { loading: boolean; variant: SentinelRecoveryBannerVariant } => {
        const loading = recoveryState.loading || accountRecovery.loading;

        if (loading) {
            return { loading: true, variant: null };
        }

        const getRecoveryItem = (id: RecoveryItemIds) => recoveryState.recoveryItems.find((i) => i.id === id);

        const emailRecoveryPathActive = !!accountRecovery.emailRecovery.value && accountRecovery.emailRecovery.hasReset;
        const phoneRecoveryPathActive = !!accountRecovery.phoneRecovery.value && accountRecovery.phoneRecovery.hasReset;

        const hasSentinelRecoveryConflict = emailRecoveryPathActive || phoneRecoveryPathActive;

        const phraseGenerated = !!getRecoveryItem('recoveryPhrase')?.isEnabled;

        let variant: SentinelRecoveryBannerVariant;
        if (hasSentinelRecoveryConflict) {
            variant = 'disable-recovery-options';
        } else if (!phraseGenerated) {
            variant = 'download-recovery-phrase';
        } else {
            variant = null;
        }

        return { loading: false, variant };
    }
);
