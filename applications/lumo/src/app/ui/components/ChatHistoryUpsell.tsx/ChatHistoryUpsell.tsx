import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon, SettingsLink } from '@proton/components';
import { LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../../hooks/useLumoPlan';
import { LUMO_USER_TYPE } from '../../../types';
import LumoUpgradeButton from '../../header/LumoUpgradeButton';
import LumoUpsellAddonButton from '../LumoUpsellAddonButton';

import './ChatHistoryUpsell.scss';

const ChatHistoryUpsellContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="chat-history-upsell rounded-sm mt-4 ml-2 mr-2 mb-0 mx-auto">
        <div className="p-3 rounded-sm text-sm text-hint">
            <p className="m-0">{children}</p>
        </div>
    </div>
);

const getChatHistoryUpsellText = (userType: LUMO_USER_TYPE) => {
    if (userType === LUMO_USER_TYPE.GUEST) {
        return {
            text: c('collider_2025: Guest Upsell')
                .t`Your chat history won't be saved. For extended chat history and other premium features, `,
            linkText: c('collider_2025: Link').t`create a free account.`,
        };
    }
    return {
        text: c('collider_2025: Upsell')
            .t`Your chat history is limited to 7 days. For extended chat history and other premium features, `,
        linkText: c('collider_2025: Link').t`upgrade to ${LUMO_SHORT_APP_NAME} Plus.`,
    };
};

// For unathenticated guest users - enhanced sign-in section
export const ChatHistoryGuestUserUpsell = () => {
    return (
        <div className="chat-history-signin-section rounded-sm mt-4 ml-2 mr-2 mb-0 mx-auto">
            <div className="p-4 rounded-sm text-center">
                {/* Header with icon */}
                <div className="mb-3">
                    <Icon name="clock-rotate-left" className="chat-history-signin-icon" />
                    <h4 className="chat-history-signin-title">
                        {c('collider_2025: Guest Signin').t`Save your chats`}
                    </h4>
                </div>

                {/* Description */}
                <p className="chat-history-signin-description mb-4">
                    {c('collider_2025: Guest Signin')
                        .t`Sign in to save your conversations and access them from anywhere.`}
                </p>

                {/* Sign In Button */}
                <ButtonLike
                    as={SettingsLink}
                    color="norm"
                    path="/signup"
                    className="w-full mt-3 mb-1">
                    <span>{c('collider_2025: Link').t`Create a free account`}</span>
                </ButtonLike>

                <ButtonLike
                    as={SettingsLink}
                    path=""
                    className="button-small w-full mt-1 mb-2">
                    <span>{c('collider_2025: Link').t`Sign in`}</span>
                </ButtonLike>
            </div>
        </div>
    );
};

// For authenticated users without any Lumo seats
export const ChatHistoryFreeUserUpsell = () => {
    const { text, linkText } = getChatHistoryUpsellText(LUMO_USER_TYPE.FREE);
    const { canShowLumoUpsellFree, isOrgOrMultiUser, canShowLumoUpsellB2BOrB2C } = useLumoPlan();

    const renderCallToAction = () => {
        if (isOrgOrMultiUser) {
            return <span> {c('collider_2025: Link').t` contact your admin`}</span>;
        }

        if (canShowLumoUpsellB2BOrB2C) {
            return (
                <LumoUpsellAddonButton type="link">{c('collider_2025: Link')
                    .t`add ${LUMO_SHORT_APP_NAME} Plus`}</LumoUpsellAddonButton>
            );
        }

        if (canShowLumoUpsellFree) {
            return (
                <LumoUpgradeButton feature={LUMO_UPSELL_PATHS.CHAT_HISTORY} buttonComponent="inline-link-button">
                    {linkText}
                </LumoUpgradeButton>
            );
        }
        return null;
    };

    return (
        <ChatHistoryUpsellContainer>
            {text}
            {renderCallToAction()}
        </ChatHistoryUpsellContainer>
    );
};
