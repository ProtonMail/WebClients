import React from 'react';

import { c } from 'ttag';

import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import InlineUpsell from '../primitives/InlineUpsell';
import useLumoPlusUpsellConfig from '../useLumoPlusUpsellButtonConfig';

import './ChatHistoryUpsell.scss';

interface LumoChatHistoryUpsellProps {
    feature?: LUMO_UPSELL_PATHS;
    asLink?: boolean;
    text?: string;
    linkText?: string;
}

interface ChatHistoryUpsellContainerProps {
    children: React.ReactNode;
}

const ChatHistoryUpsellContainer = ({ children }: ChatHistoryUpsellContainerProps) => (
    <div className="chat-history-upsell rounded-sm mt-2 ml-2 mr-2 mb-2 mx-auto">
        <div className="p-3 rounded-sm text-sm text-hint">
            <p className="m-0">{children}</p>
        </div>
    </div>
);

export const LumoChatHistoryUpsell = ({
    feature = LUMO_UPSELL_PATHS.CHAT_HISTORY,
    text,
}: LumoChatHistoryUpsellProps) => {
    const config = useLumoPlusUpsellConfig(feature);
    const { canShowTalkToAdminLumoUpsell } = useLumoPlan();

    const descriptiveText =
        text ||
        c('collider_2025: Upsell')
            .t`Your chat history is limited to 7 days. For unlimited chat history and other premium features, `;

    if (canShowTalkToAdminLumoUpsell) {
        return (
            <ChatHistoryUpsellContainer>
                {descriptiveText}
                <span> {c('collider_2025: Info').t` talk to your admin.`}</span>
            </ChatHistoryUpsellContainer>
        );
    }

    if (!config) return null;

    return (
        <ChatHistoryUpsellContainer>
            {descriptiveText}
            <InlineUpsell
                path={config.path}
                onUpgrade={config.onUpgrade}
                callToActionText={config.getChatCTAContent()}
                className={config?.className}
            />
        </ChatHistoryUpsellContainer>
    );
};

LumoChatHistoryUpsell.displayName = 'LumoChatHistoryUpsell';
