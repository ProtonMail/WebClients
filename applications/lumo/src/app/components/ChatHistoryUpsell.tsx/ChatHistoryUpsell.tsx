import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Icon, SettingsLink } from '@proton/components';

import './ChatHistoryUpsell.scss';

// For unathenticated guest users - enhanced sign-in section
export const ChatHistoryGuestUserUpsell = () => {
    return (
        <div className="chat-history-signin-section rounded-sm mt-4 ml-0 md:ml-2 mr-2 mb-0 mx-auto">
            <div className="p-4 rounded-sm text-center">
                {/* Header with icon */}
                <div className="mb-3">
                    <Icon name="clock-rotate-left" className="chat-history-signin-icon" />
                    <h4 className="chat-history-signin-title">{c('collider_2025: Guest Signin').t`Save your chats`}</h4>
                </div>

                {/* Description */}
                <p className="chat-history-signin-description mb-4">
                    {c('collider_2025: Guest Signin')
                        .t`Sign in to save your conversations and access them from anywhere.`}
                </p>

                {/* Sign In Button */}
                <ButtonLike as={SettingsLink} color="norm" path="/signup" className="w-full mt-3 mb-1">
                    <span>{c('collider_2025: Link').t`Create a free account`}</span>
                </ButtonLike>

                <ButtonLike as={SettingsLink} path="" className="button-small w-full mt-1 mb-2">
                    <span>{c('collider_2025: Link').t`Sign in`}</span>
                </ButtonLike>
            </div>
        </div>
    );
};
