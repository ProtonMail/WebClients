import { c } from 'ttag';

import { SettingsLink } from '@proton/components';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';

import './ChatHistoryUpsell.scss';

// For unathenticated guest users - enhanced sign-in section
export const ChatHistoryGuestUserUpsell = () => {
    return (
        <div className="chat-history-signin-section rounded-xl ml-0 md:ml-2 mr-2 mb-0 mx-auto overflow-y-auto bg-norm">
            <div className="p-3 rounded-sm flex flex-column flex-nowrap gap-2">
                {/* Header with icon */}
                <div className="flex flex-row flex-nowrap items-center justify-space-between gap-2 shrink-0">
                    <h4 className="text-rg text-semibold color-weak">{c('collider_2025: Guest Signin')
                        .t`Save your chats`}</h4>
                    <IcClockRotateLeft size={4} className="chat-history-signin-icon" />
                </div>

                {/* Description */}
                <p className="m-0 color-weak shrink-0">
                    {c('collider_2025: Guest Signin')
                        .t`Sign in to save your conversations and access them from anywhere.`}
                </p>

                <SettingsLink path="signup" className="w-full mb-1 shrink-0 lumo-mobile-signup-button">
                    <p className="m-0">{c('collider_2025: Link').t`Create a free account`}</p>
                </SettingsLink>

                <SettingsLink path="" className="w-full mb-1 shrink-0 lumo-mobile-signin-button">
                    <p className="m-0">{c('collider_2025: Link').t`Sign in`}</p>
                </SettingsLink>
            </div>
        </div>
    );
};
