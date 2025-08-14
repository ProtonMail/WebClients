import { c } from 'ttag';

import { SettingsLink } from '@proton/components';
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

// For unathenticated guest users
export const ChatHistoryGuestUserUpsell = () => {
    const { text, linkText } = getChatHistoryUpsellText(LUMO_USER_TYPE.GUEST);
    return (
        <ChatHistoryUpsellContainer>
            {text}
            <SettingsLink path="/signup" className="link inline-block">
                {linkText}
            </SettingsLink>
        </ChatHistoryUpsellContainer>
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
