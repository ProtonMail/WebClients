import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { hasActiveZendeskChat } from './LiveChatZendesk';
import type { ZendeskRef } from './helper';
import { useCanAccessZendeskChat } from './useCanAccessZendeskChat';

export const useZendeskChat = (user: UserModel) => {
    const history = useHistory();
    const canAccessZendeskChat = useCanAccessZendeskChat(user);
    const [showZendeskChat, setShowZendeskChat] = useState({ autoLaunch: false, render: false });
    const zendeskRef = useRef<ZendeskRef>();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hasChatQueryParamFromSupport = !!searchParams.get('chat');
        const activeZendeskChat = hasActiveZendeskChat();

        if (hasChatQueryParamFromSupport) {
            searchParams.delete('chat');
            history.replace({
                search: searchParams.toString(),
            });
        }
        if (canAccessZendeskChat && (hasChatQueryParamFromSupport || activeZendeskChat)) {
            setShowZendeskChat({ autoLaunch: hasChatQueryParamFromSupport, render: true });
        }
    }, []);

    const handleOpenZendeskChat = canAccessZendeskChat
        ? () => {
              setShowZendeskChat({ autoLaunch: true, render: true });
          }
        : undefined;

    return {
        zendeskRef,
        showZendeskChat,
        handleOpenZendeskChat,
    };
};
