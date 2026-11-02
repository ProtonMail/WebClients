import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';

import type { ItemTypeFilter } from '../../../types/data/items';
import type { Maybe } from '../../../types/utils';

const getTypeFilterMessages = (): Record<Exclude<ItemTypeFilter, '*'>, string> => ({
    // translator: shown on app start when the item list is still filtered on the type selected before the restart
    login: c('Info').t`Only logins are shown`,
    // translator: shown on app start when the item list is still filtered on the type selected before the restart
    alias: c('Info').t`Only aliases are shown`,
    // translator: shown on app start when the item list is still filtered on the type selected before the restart
    creditCard: c('Info').t`Only cards are shown`,
    // translator: shown on app start when the item list is still filtered on the type selected before the restart
    note: c('Info').t`Only notes are shown`,
    // translator: shown on app start when the item list is still filtered on the type selected before the restart
    identity: c('Info').t`Only identities are shown`,
    // translator: shown on app start when the item list is still filtered on the type selected before the restart
    custom: c('Info').t`Only custom items are shown`,
});

export const useTypeFilterNotification = () => {
    const { createNotification, hideNotification } = useNotifications();

    return useCallback((type: ItemTypeFilter, onShowAll: () => void) => {
        if (type === '*') return;

        let id: Maybe<number>;

        const handleShowAll = () => {
            if (id !== undefined) hideNotification(id);
            onShowAll();
        };

        id = createNotification({
            text: (
                <>
                    <span>{getTypeFilterMessages()[type]}</span>
                    <NotificationButton onClick={handleShowAll}>
                        {
                            // translator: action removing the item type filter from the list
                            c('Action').t`Show all`
                        }
                    </NotificationButton>
                </>
            ),
        });
    }, []);
};
