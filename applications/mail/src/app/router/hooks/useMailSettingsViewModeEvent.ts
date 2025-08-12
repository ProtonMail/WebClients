import { useLocation } from 'react-router-dom';

import { useSubscribeEventManager } from '@proton/components';

import { isConversationMode } from 'proton-mail/helpers/mailSettings';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import type { Event } from '../../models/event';
import type { RouterNavigation } from '../interface';

interface Props {
    navigation: RouterNavigation;
}

/**
 * This hook listen to mail settings change and move back when the view mode change
 * This is done to avoid loading the wrong ID when changing the setting.
 *
 * For example, loading a conversation ID as a message ID
 */
export const useMailSettingsViewModeEvent = ({ navigation }: Props) => {
    const mailParams = useMailSelector(params);
    const location = useLocation();

    useSubscribeEventManager(async ({ MailSettings }: Event) => {
        if (MailSettings) {
            const newConversationMode = isConversationMode(mailParams.labelID, MailSettings, location);
            if (mailParams.conversationMode !== newConversationMode) {
                navigation.handleBack();
            }
        }
    });
};
