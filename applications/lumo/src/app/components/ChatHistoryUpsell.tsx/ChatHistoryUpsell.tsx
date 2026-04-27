import { useCallback } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { SettingsLink } from '@proton/components';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';

import { useGuestMigration } from '../../hooks/useGuestMigration';
import { useConversation } from '../../providers/ConversationProvider';

import './ChatHistoryUpsell.scss';

// For unathenticated guest users - enhanced sign-in section
export const ChatHistoryGuestUserUpsell = () => {
    const { captureGuestState } = useGuestMigration();
    const { conversationId } = useConversation();

    const handleSignUpClick = useCallback(async () => {
        try {
            const captured = await captureGuestState();
            if (captured) {
                console.log('Guest state captured and encrypted for sign-up migration');
            }
        } catch (error) {
            console.error('Failed to capture guest state:', error);
        }
        // Let the SettingsLink handle the actual navigation
    }, [captureGuestState]);

    const handleSignInClick = useCallback(async () => {
        try {
            const captured = await captureGuestState();
            if (captured) {
                console.log('Guest state captured and encrypted for sign-in migration');
            }
        } catch (error) {
            console.error('Failed to capture guest state:', error);
        }
        // Let the SettingsLink handle the actual navigation
    }, [captureGuestState]);

    // Update button text if there's an active conversation
    const signUpText = conversationId
        ? c('collider_2025: Link').t`Save this chat & create account`
        : c('collider_2025: Link').t`Create a free account`;

    return (
        <div className="chat-history-signin-section rounded-sm mt-4 ml-0 md:ml-2 mr-2 mb-0 mx-auto">
            <div className="p-4 rounded-sm text-center">
                {/* Header with icon */}
                <div className="mb-3">
                    <IcClockRotateLeft className="chat-history-signin-icon" />
                    <h4 className="chat-history-signin-title">{c('collider_2025: Guest Signin').t`Save your chats`}</h4>
                </div>

                {/* Description */}
                <p className="chat-history-signin-description mb-4">
                    {c('collider_2025: Guest Signin')
                        .t`Sign in to save your conversations and access them from anywhere.`}
                </p>

                {/* Sign Up Button */}
                <ButtonLike
                    as={SettingsLink}
                    color="norm"
                    path="/signup"
                    className="w-full mt-3 mb-1"
                    onClick={handleSignUpClick}
                >
                    <span>{signUpText}</span>
                </ButtonLike>

                <ButtonLike
                    as={SettingsLink}
                    path=""
                    className="button-small w-full mt-1 mb-2"
                    onClick={handleSignInClick}
                >
                    <span>{c('collider_2025: Link').t`Sign in`}</span>
                </ButtonLike>
            </div>
        </div>
    );
};
