import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_USER_TYPE } from '../types';
import type { LumoRemainingLimits } from '../types-api';

// const UpgradeLumoLink = () => {
//     return (
//         <SettingsLink path="/signup">{c('collider_2025: Upsell')
//             .t`upgrade to ${LUMO_SHORT_APP_NAME} Plus`}</SettingsLink>
//     );
// };

// export const getErrorMessage = (errorType: LUMO_API_ERRORS, userType: LUMO_USER_TYPE) => {
//     if (errorType === LUMO_API_ERRORS.HIGH_DEMAND) {
//         if (userType === LUMO_USER_TYPE.GUEST || userType === LUMO_USER_TYPE.FREE) {
//             return c('collider_2025: Error')
//                 .jt`Due to high demand, ${LUMO_SHORT_APP_NAME} is taking longer than usual to respond. Try again later or, to enjoy priority access, ${UpgradeLumoLink}.`;
//         } else {
//             return c('collider_2025: Error')
//                 .t`Due to high demand, ${LUMO_SHORT_APP_NAME} is taking longer than usual to respond to your message. For priority access to the service consider upgrading to ${LUMO_SHORT_APP_NAME} Plus or please try again later.`;
//         }
//     }
//     if (errorType === LUMO_API_ERRORS.CONTEXT_WINDOW_EXCEEDED) {
//         return c('collider_2025: Error')
//             .t`Looks like this conversation is getting pretty long. To keep responses as accurate and helpful as possible we recommend starting a new chat.`;
//     }

//     throw new Error('Unknown error type');
// };

export const getExceedTierErrorMessage = (userType: LUMO_USER_TYPE) => {
    if (userType === LUMO_USER_TYPE.GUEST) {
        return c('collider_2025: Error')
            .t`Sign up for free to continue chatting and unlock access to chat history, starred chats, and more features.`;
    }
    if (userType === LUMO_USER_TYPE.FREE) {
        return c('collider_2025: Error')
            .t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus for unlimited chats, extended history, access to advanced AI models, and more.`;
    }
    throw new Error('Unknown user type');
};

export const getExceededTierErrorTitle = (remainingLimits?: LumoRemainingLimits | null) => {
    const liteExhausted = remainingLimits?.lite === 0;
    const maxExhausted = remainingLimits?.max === 0;

    if (liteExhausted && maxExhausted) {
        return c('collider_2025: Error Title')
            .t`You've reached your ${LUMO_SHORT_APP_NAME} 2.0 Lite and ${LUMO_SHORT_APP_NAME} 2.0 Max limits`;
    }
    if (liteExhausted) {
        return c('collider_2025: Error Title').t`You've reached your ${LUMO_SHORT_APP_NAME} 2.0 Lite limit`;
    }
    if (maxExhausted) {
        return c('collider_2025: Error Title').t`You've reached your ${LUMO_SHORT_APP_NAME} 2.0 Max limit`;
    }

    return c('collider_2025: Error Title').t`You've reached a model limit`;
};

export const getGenerationRejectedErrorMessage = (userType: LUMO_USER_TYPE) => {
    if (userType === LUMO_USER_TYPE.GUEST || userType === LUMO_USER_TYPE.FREE) {
        return c('collider_2025: Error Message')
            .t`If retrying doesn't work, check back later or consider upgrading to ${LUMO_SHORT_APP_NAME} Plus to jump to the front of the line during peak times.`;
    }
    return c('collider_2025: Error Message')
        .t`If retrying doesn't work, check back in a few minutes. In the meantime, we are doing our best to ensure your experience goes smoothly.`;
};

export const getHighDemandErrorMessage = (userType: LUMO_USER_TYPE) => {
    if (userType === LUMO_USER_TYPE.GUEST || userType === LUMO_USER_TYPE.FREE) {
        return c('collider_2025: Error Message')
            .t`We're experiencing unusually high demand. If retrying doesn't work, check back in a few minutes or upgrade for priority access to ${LUMO_SHORT_APP_NAME}.`;
    }
    return c('collider_2025: Error Message')
        .t`If retrying doesn't work, check back in a few minutes. In the meantime, we are doing our best to ensure your experience goes smoothly.`;
};
