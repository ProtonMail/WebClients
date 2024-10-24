import { c } from 'ttag';

import type { UserSettings } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { RecoveryCardStatusProps } from './RecoveryCardStatus';

export type EmailSettings = Pick<UserSettings['Email'], 'Value' | 'Status' | 'Notify' | 'Reset'>;
export type PhoneSettings = Pick<UserSettings['Phone'], 'Value' | 'Status' | 'Notify' | 'Reset'>;
interface Ids {
    account: string;
    data: string;
}

interface CallToAction {
    text: string;
    path: string;
}
export const populateCallToActions = (
    type: 'phone number' | 'email address' | `recovery phrase`,
    ids: Ids,
    set?: boolean,
    verified?: boolean,
    enabled?: boolean,
    hasMnemonic?: boolean
): CallToAction => {
    if (type === 'recovery phrase') {
        return {
            text: c('Info').t`Set recovery phrase`,
            path: `/recovery#${ids.data}`,
        };
    }

    let text = '';

    if (!set) {
        if (type === 'phone number') {
            text = c('Info').t`Add a recovery phone number`;
        } else if (type === 'email address') {
            text = c('Info').t`Add a recovery email address`;
        }
    } else if (hasMnemonic && enabled) {
        if (type === 'phone number') {
            text = c('Info').t`Disable recovery by phone number`;
        } else if (type === 'email address') {
            text = c('Info').t`Disable recovery by email address`;
        }
    } else {
        if (type === 'phone number') {
            text = c('Info').t`Verify phone number`;
        } else if (type === 'email address') {
            text = c('Info').t`Verify email address`;
        }
    }
    return {
        text: text,
        path: `/recovery#${ids.account}`,
    };
};

const sortActionTypes = (a: CallToAction, b: CallToAction) => {
    if (a.text.startsWith('Disable') && !b.text.startsWith('Disable')) {
        return -1;
    } else if (!a.text.startsWith('Disable') && b.text.startsWith('Disable')) {
        return 1;
    } else {
        return 0;
    }
};

const getSentinelRecoveryProps = (
    email: EmailSettings,
    phone: PhoneSettings,
    hasMnemonic: boolean,
    ids: Ids
): RecoveryCardStatusProps => {
    const hasEmail = !!email.Value;
    const hasEmailVerified = !!email.Status;
    const hasEmailEnabled = !!email.Reset;
    const hasPhone = !!phone.Value;
    const hasPhoneVerified = !!phone.Status;
    const hasPhoneEnabled = !!phone.Reset;

    const hasVerifiedandDisabledEmail = hasEmail && hasEmailVerified && !hasEmailEnabled;
    const hasVerifiedandDisabledPhone = hasPhone && hasPhoneVerified && !hasPhoneEnabled;

    // case 10
    if (hasMnemonic && hasVerifiedandDisabledEmail && hasVerifiedandDisabledPhone) {
        return {
            type: 'success',
            statusText: c('Info').t`Your account recovery method is set`,
            callToActions: [],
        };
    }

    const emailCTA = populateCallToActions(
        'email address',
        ids,
        hasEmail,
        hasEmailVerified,
        hasEmailEnabled,
        hasMnemonic
    );
    const phoneCTA = populateCallToActions(
        'phone number',
        ids,
        hasPhone,
        hasPhoneVerified,
        hasPhoneEnabled,
        hasMnemonic
    );
    const recoveryCTA = populateCallToActions('recovery phrase', ids);
    // case 2,7,8,9
    if (hasMnemonic) {
        return {
            type: 'warning',
            statusText: c('Info').t`To ensure highest possible security of your account`,
            callToActions: [!hasVerifiedandDisabledEmail && emailCTA, !hasVerifiedandDisabledPhone && phoneCTA]
                .filter(isTruthy)
                .sort(sortActionTypes),
        };
    }
    // case 6
    if (!hasMnemonic && ((hasEmailVerified && hasEmailEnabled) || (hasPhoneVerified && hasPhoneEnabled))) {
        return {
            type: 'warning',
            statusText: c('Info').t`To ensure highest possible security of your account`,
            callToActions: [recoveryCTA, !hasEmailVerified && emailCTA, !hasPhoneVerified && phoneCTA].filter(isTruthy),
        };
    }
    //case 5
    if (
        !hasMnemonic &&
        ((hasEmail && hasEmailEnabled && !hasEmailVerified) || (hasPhone && hasPhoneEnabled && !hasPhoneVerified))
    ) {
        return {
            type: 'warning',
            statusText: c('Info').t`To ensure continuous access to your account, set an account recovery method`,
            callToActions: [
                recoveryCTA,
                !hasVerifiedandDisabledEmail && emailCTA,
                !hasVerifiedandDisabledPhone && phoneCTA,
            ].filter(isTruthy),
        };
    }

    // case 1, 3, 4
    return {
        type: 'danger',
        statusText: c('Info').t`No account recovery method set; you are at risk of losing access to your account`,
        callToActions: [
            !hasMnemonic && recoveryCTA,
            !hasVerifiedandDisabledEmail && emailCTA,
            !hasVerifiedandDisabledPhone && phoneCTA,
        ].filter(isTruthy),
    };
};

export default getSentinelRecoveryProps;
