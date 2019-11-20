import { useEffect } from 'react';
import { useLabels, useUser } from 'react-components';
import { getLabelName } from '../helpers/labels';
import { Element } from '../models/element';
import { countUnread } from '../helpers/elements';

export const useMailboxPageTitle = (labelID: string, elements: Element[]) => {
    const [labels, loadingLabels] = useLabels();
    const [user, loadingUser] = useUser();

    useEffect(() => {
        if (!loadingLabels && !loadingUser) {
            const unreads = countUnread(elements);
            const unreadString = unreads > 0 ? `(${unreads}) ` : '';
            const labelName = getLabelName(labelID, labels);
            const address = user.Email;
            document.title = `${unreadString}${labelName} | ${address} | ProtonMail`;
        }
    }, [labelID, labels, loadingLabels, user, loadingUser, elements]);
};
