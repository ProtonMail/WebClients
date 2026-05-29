import { useMemo } from 'react';

import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { TipData } from 'proton-mail/models/tip';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

const useGetRandomTip = (tipMessages: TipData[]) => {
    const labelID = useMailSelector(selectLabelID);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-317EBD
    const randomOption = useMemo(() => getRandomOption(), [labelID]);

    return {
        randomOption,
    };
};

export default useGetRandomTip;
