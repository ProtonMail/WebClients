import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_USER_TYPE } from '../types';

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

export const getExceededTierErrorTitle = () => {
    return c('collider_2025: Error Title').t`You've reached your weekly chat limit`;
};
