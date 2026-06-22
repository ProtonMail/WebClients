import { useEffect, useSyncExternalStore } from 'react';

import { useEventManager } from '@proton/components/index';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getVisibilityStateSingleton } from '@proton/shared/lib/eventManager/VisibilityState';

import { TabState } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
}

export const useCategoriesBadge = ({ category, tabState }: Props) => {
    const [mailSettings] = useMailSettings();
    const [systemFolders] = useSystemFolders();

    const { getEventID } = useEventManager();

    const visibility = getVisibilityStateSingleton();
    const isVisible = useSyncExternalStore(visibility.subscribe, () => visibility.visible);

    // The counter is displayed if the setting is enabled or if the tab is active
    const shouldShowCounter = mailSettings.MailCategoryViewCountersEnabled || tabState === TabState.ACTIVE;

    // The badge is displayed if the category folder exists and has a non-null LastUnseenMessageEventID
    const categoryFolder = systemFolders?.find((folder) => folder.ID === category.id);
    const eventID = categoryFolder?.LastUnseenMessageEventID ?? null;
    const shouldShowNewBadge = eventID !== null;

    useEffect(() => {
        if (eventID === null || !isVisible) {
            return;
        }

        const timer = setTimeout(() => {
            // TODO dispatch the action that will update the LastUnseenMessageEventID
            // dispatch(markCategorySeen(category.id, eventID, lastEventID));
        }, 10_000);
        return () => clearTimeout(timer);
    }, [category.id, eventID, isVisible, getEventID]);

    const handleTabClick = () => {
        if (eventID === null) {
            return;
        }

        // TODO dispatch the action that will update the LastUnseenMessageEventID
        // dispatch(markCategorySeen(category.id, eventID, lastEventID));
    };

    return {
        shouldShowCounter,
        shouldShowNewBadge,
        handleTabClick,
    };
};
