import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/components';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { isCustomFolder } from '@proton/mail/helpers/location';
import {
    type TelemetryEvents,
    TelemetryMailNewsletterSubscriptions,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

import { useMailSelector } from 'proton-mail/store/hooks';
import type { SortSubscriptionsValue } from 'proton-mail/store/newsletterSubscriptions/interface';
import { allSubscriptionCount } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { type ModalFilterType, NewsletterMessagesAction, type NewsletterSubscriptionAction } from './interface';
import {
    getNewlsetterCountDimension,
    getNewsletterDestinationFolder,
    getNewsletterMessagesAction,
} from './useNewsletterSubscriptionTelemetry.helpers';

export const useNewsletterSubscriptionTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const [folders = []] = useFolders();

    const subscriptionsCount = useMailSelector(allSubscriptionCount);

    const sendReport = (event: TelemetryEvents, dimensions?: SimpleMap<string>) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.mailNewsletterSubscriptions,
            event,
            dimensions: { ...dimensions, newsletterNumber: getNewlsetterCountDimension(subscriptionsCount) },
            delay: false,
        });
    };

    const sendNewslettersViewVisit = (firstVisit: boolean) => {
        sendReport(TelemetryMailNewsletterSubscriptions.newsletters_view_visit, {
            firstVisit: firstVisit ? 'true' : 'false',
        });
    };

    const sendNewsletterAction = ({
        newsletterAction,
        applyToFuture = false,
        markAsRead = false,
        moveToTrash = false,
        moveToArchive = false,
        labelId,
    }: {
        newsletterAction: NewsletterSubscriptionAction;
        applyToFuture?: boolean;
        markAsRead?: boolean;
        moveToTrash?: boolean;
        moveToArchive?: boolean;
        labelId?: string;
    }) => {
        sendReport(TelemetryMailNewsletterSubscriptions.newsletter_action, {
            newsletterAction,
            applyToFuture: applyToFuture ? 'true' : 'false',
            markAsRead: markAsRead ? 'true' : 'false',
            folderDestination: getNewsletterDestinationFolder(
                moveToTrash,
                moveToArchive,
                isCustomFolder(labelId ?? '', folders)
            ),
        });
    };

    const sendNewsletterMessagesAction = (action: ModalFilterType, applyToFuture: boolean) => {
        sendReport(TelemetryMailNewsletterSubscriptions.newsletter_messages_action, {
            newsletterMessagesAction: getNewsletterMessagesAction(action),
            applyToFuture: applyToFuture ? 'true' : 'false',
        });
    };

    const sendNewsletterMessageFilterUpsell = () => {
        sendReport(TelemetryMailNewsletterSubscriptions.newsletter_messages_action, {
            newsletterMessagesAction: NewsletterMessagesAction.filterUpsell,
        });
    };

    const sendNewslettersListSorting = (sorting: SortSubscriptionsValue) => {
        sendReport(TelemetryMailNewsletterSubscriptions.newsletters_list_sorting, {
            sorting,
        });
    };

    const sendNewslettersListPagination = () => {
        sendReport(TelemetryMailNewsletterSubscriptions.newsletters_list_pagination, {});
    };

    return {
        sendNewslettersViewVisit,
        sendNewsletterAction,
        sendNewsletterMessagesAction,
        sendNewsletterMessageFilterUpsell,
        sendNewslettersListSorting,
        sendNewslettersListPagination,
    };
};
