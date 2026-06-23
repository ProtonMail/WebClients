import { useEventManager } from '@proton/components/index';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { updateLastUnseenEventId } from '@proton/mail/store/labels/actions';
import { useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { useFlag } from '@proton/unleash/useFlag';

import { TabState } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
}

export const useCategoriesBadge = ({ category, tabState }: Props) => {
    const [mailSettings] = useMailSettings();
    const [systemFolders] = useSystemFolders();

    const dispatch = useDispatch();
    const { getEventID } = useEventManager();

    const showBadge = useFlag('CategoriesUnseenBadge');

    // The counter is displayed if the setting is enabled or if the tab is active
    const shouldShowCounter = mailSettings.MailCategoryViewCountersEnabled || tabState === TabState.ACTIVE;

    // The badge is displayed if the category folder exists and has a non-null LastUnseenMessageEventID
    const categoryFolder = systemFolders?.find((folder) => folder.ID === category.id);
    const eventID = categoryFolder?.LastUnseenMessageEventID ?? null;
    const shouldShowNewBadge = eventID !== null && tabState !== TabState.ACTIVE;

    const handleTabClick = () => {
        const lastEventID = getEventID();
        if (eventID === null || !lastEventID) {
            return;
        }

        void dispatch(updateLastUnseenEventId({ labelID: category.id, lastEventID }));
    };

    return {
        shouldShowCounter: shouldShowCounter && showBadge,
        shouldShowNewBadge: shouldShowNewBadge && showBadge,
        handleTabClick,
    };
};
