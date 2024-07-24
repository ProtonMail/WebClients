import { useMemo } from 'react';

import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { TipData } from 'proton-mail/models/tip';

const useGetRandomTip = (tipMessages: TipData[]) => {
    const encounteredMessagesIDs = JSON.parse(getItem('MailboxPlaceholderEncounteredTips') || '[]');

    const getRandomOption = (): TipData => {
        const hasSeenAllMessages = tipMessages.every(({ id }) => encounteredMessagesIDs.includes(id));

        const encounteredMessages = hasSeenAllMessages ? [] : encounteredMessagesIDs;
        const filteredOptions = tipMessages.filter((option) => !encounteredMessages.includes(option.id));

        const randomOption = filteredOptions.length
            ? filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
            : tipMessages[0];

        setItem('MailboxPlaceholderEncounteredTips', JSON.stringify([...encounteredMessages, randomOption.id]));
        return randomOption;
    };

    const randomOption = useMemo(() => getRandomOption(), []);

    return {
        randomOption,
    };
};

export default useGetRandomTip;
