import { useEffect, useRef } from 'react';

import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { useGetMailSettings } from '@proton/mail/store/mailSettings/hooks';
import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { isUnread } from '../helpers/conversation';
import type { ElementsStructure } from '../hooks/mailbox/useElements';
import { selectShouldReportUnreadCount } from '../store/categories/categoriesSelector';
import { useMailSelector } from '../store/hooks';

const key = 'unreadCategoryCount';
const REPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour, avoids duplicate reports across tabs opened around the same time

export const useUnreadCategoryCount = ({ elements, labelID, loading }: ElementsStructure) => {
    const canReportUnread = useMailSelector(selectShouldReportUnreadCount);
    const { sendReportUnreadCount } = useCategoriesTelemetry();

    const getMailSetting = useGetMailSettings();
    const isReportUnreadCountDisabled = useFlag('CategoryReportUnreadCountDisabled');

    // Always holds the latest elements/labelID without being a dependency: the effect below
    // must only re-run when the reporting gate flips, not on every elements-list churn.
    const latestRef = useRef({ elements, labelID });
    latestRef.current = { elements, labelID };

    useEffect(() => {
        if (!canReportUnread || loading || isReportUnreadCountDisabled) {
            return;
        }

        // Once per tab session: navigating away from Inbox/Primary and back must not re-trigger a report.
        const sessionItem = getItem(key, 'false');
        if (sessionItem === 'true') {
            return;
        }

        if (localStorageWithExpiry.getData(key) === 'true') {
            // Another tab already reported within the window: mark this session as done too,
            // so this tab doesn't send its own report once the window lapses.
            setItem(key, 'true');
            return;
        }

        const reportUnreadCount = async () => {
            const { elements, labelID } = latestRef.current;
            const total = elements.length;
            if (total === 0) {
                return;
            }

            const unread = elements.filter((e) => isUnread(e, labelID)).length;
            const readPercentage = Math.round(((total - unread) / total) * 10_000) / 100;

            const { MailCategoryView } = await getMailSetting();
            sendReportUnreadCount(readPercentage, MailCategoryView);

            setItem(key, 'true');
            localStorageWithExpiry.storeData(key, 'true', REPORT_WINDOW_MS);
        };

        void reportUnreadCount().catch(noop);
    }, [canReportUnread, isReportUnreadCountDisabled, loading, sendReportUnreadCount, getMailSetting]);
};
