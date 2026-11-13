import { ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { Report, ReportSummary } from '@proton/activation/src/logic/reports/reports.interface';
import type { Feature } from '@proton/features/interface';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    applyNewsletterSubscriptionFilter,
    getNewsletterSubscription,
    unsubscribeNewsletterSubscription,
} from '@proton/shared/lib/api/newsletterSubscription';
import { HTTP_STATUS_CODE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type {
    ApplyNewsletterSubscriptionsFilter,
    GetNewsletterSubscriptionsApiResponse,
    NewsletterSubscription,
} from '@proton/shared/lib/interfaces/NewsletterSubscription';

const MAX_BYOE_INBOX_CLEANUP_SENDERS = 10;

/**
 * Never-read senders first, then the ones read longest ago, then the ones with the most unread messages.
 * Written out because `getPaginationQueryString` has no way to sort on `LastReadTime`.
 */
export const BYOE_INBOX_CLEANUP_SENDERS_QUERY =
    'PageSize=100&Active=1&Spam=0&Sort[LastReadTime]=ASC&Sort[UnreadMessageCount]=DESC&Sort[ID]=DESC';

/**
 * Reads one page only: the next page is rejected by the server when the last sender of this one was never read.
 * Rejects when the request fails, so the caller can tell a failure apart from having nothing to offer.
 */
export const getBYOEInboxCleanupSenders = async (api: Api): Promise<NewsletterSubscription[]> => {
    const { NewsletterSubscriptions } = await getSilentApi(api)<GetNewsletterSubscriptionsApiResponse>(
        getNewsletterSubscription({ paginationString: BYOE_INBOX_CLEANUP_SENDERS_QUERY })
    );

    const oneClickSenders = NewsletterSubscriptions.filter((subscription) => {
        return !!subscription.UnsubscribeMethods.OneClick;
    });
    const sendersToDisplay = oneClickSenders.slice(0, MAX_BYOE_INBOX_CLEANUP_SENDERS);

    return sendersToDisplay;
};

interface BYOEInboxCleanupSenderProgress {
    unsubscribed: boolean;
    archived: boolean;
}

/**
 * What has already been done for each sender, by subscription ID, so pressing "Unsubscribe" again only redoes what failed.
 */
export type BYOEInboxCleanupProgress = Map<string, BYOEInboxCleanupSenderProgress>;

type SilentApi = ReturnType<typeof getSilentApi>;

const getArchiveFilter = (
    subscription: NewsletterSubscription,
    ApplyTo: ApplyNewsletterSubscriptionsFilter['ApplyTo']
): ApplyNewsletterSubscriptionsFilter => {
    return { ApplyTo, DestinationFolder: MAILBOX_LABEL_IDS.ARCHIVE, MarkAsRead: !!subscription.MarkAsRead };
};

/**
 * With `applyToFuture`, also creates a rule for the sender's future mail. Any 422 on the rule is taken as the
 * person having reached their limit on rules, and their existing mail is archived without one.
 */
const archiveSender = async (silentApi: SilentApi, subscription: NewsletterSubscription, applyToFuture: boolean) => {
    if (!applyToFuture) {
        await silentApi(applyNewsletterSubscriptionFilter(subscription.ID, getArchiveFilter(subscription, 'Existing')));
        return;
    }

    try {
        await silentApi(applyNewsletterSubscriptionFilter(subscription.ID, getArchiveFilter(subscription, 'All')));
    } catch (error) {
        const isRuleRefused = getApiError(error).status === HTTP_STATUS_CODE.UNPROCESSABLE_ENTITY;
        if (!isRuleRefused) {
            throw error;
        }
        await silentApi(applyNewsletterSubscriptionFilter(subscription.ID, getArchiveFilter(subscription, 'Existing')));
    }
};

interface CleanUpSenderOptions {
    silentApi: SilentApi;
    subscription: NewsletterSubscription;
    archive: boolean;
    applyToFuture: boolean;
    progress: BYOEInboxCleanupProgress;
}

const cleanUpSender = async ({ silentApi, subscription, archive, applyToFuture, progress }: CleanUpSenderOptions) => {
    const senderProgress = progress.get(subscription.ID) ?? { unsubscribed: false, archived: false };
    progress.set(subscription.ID, senderProgress);

    if (!senderProgress.unsubscribed) {
        await silentApi(unsubscribeNewsletterSubscription(subscription.ID));
        senderProgress.unsubscribed = true;
    }

    if (archive && !senderProgress.archived) {
        await archiveSender(silentApi, subscription, applyToFuture);
        senderProgress.archived = true;
    }
};

interface CleanUpBYOEInboxSendersOptions {
    api: Api;
    subscriptions: NewsletterSubscription[];
    archive: boolean;
    applyToFuture: boolean;
    progress: BYOEInboxCleanupProgress;
}

/**
 * Unsubscribes every sender at once and, when `archive` is set, archives the mail of each one whose unsubscribe worked.
 * Skips whatever `progress` says is already done, and records each step as it succeeds.
 * Resolves to whether every sender is now done; a failed sender never stops the others.
 */
export const cleanUpBYOEInboxSenders = async ({
    api,
    subscriptions,
    archive,
    applyToFuture,
    progress,
}: CleanUpBYOEInboxSendersOptions): Promise<boolean> => {
    const silentApi = getSilentApi(api);

    const results = await Promise.allSettled(
        subscriptions.map((subscription) => {
            return cleanUpSender({ silentApi, subscription, archive, applyToFuture, progress });
        })
    );

    return results.every(({ status }) => {
        return status === 'fulfilled';
    });
};

interface ReportEntry {
    summary: ReportSummary;
    report: Report;
}

type BYOEInboxCleanupImportOutcome = 'done' | 'failed';

interface GetFinishedBYOEImportOutcomeOptions {
    entries: ReportEntry[];
    addresses: Address[];
    feature: Feature<boolean> | undefined;
}

const getMailOutcome = (summary: ReportSummary): BYOEInboxCleanupImportOutcome | undefined => {
    if (summary.product !== ImportType.MAIL) {
        return undefined;
    }
    if (summary.state === ApiImporterState.DONE) {
        return 'done';
    }
    if (summary.state === ApiImporterState.FAILED || summary.state === ApiImporterState.CANCELED) {
        return 'failed';
    }
    return undefined;
};

/**
 * How the finished mail import into a BYOE address that ended at or after the feature value was last set ended.
 * A report's end time is set when it's created, so only the mail summary's state says it has finished.
 * The server doesn't record how an import was started, so the person's own import of the same account counts too.
 */
export const getFinishedBYOEImportOutcome = ({
    entries,
    addresses,
    feature,
}: GetFinishedBYOEImportOutcomeOptions): BYOEInboxCleanupImportOutcome | undefined => {
    const connectionTimeBYOE = feature?.UpdateTime;
    if (feature?.Value !== true || typeof connectionTimeBYOE !== 'number') {
        return undefined;
    }

    const byoeEmails = new Set(
        addresses.filter(getIsBYOEAddress).map(({ Email }) => {
            return canonicalizeEmail(Email);
        })
    );

    let latestOutcome: BYOEInboxCleanupImportOutcome | undefined;
    let latestEndDate = Number.NEGATIVE_INFINITY;
    for (const { summary, report } of entries) {
        const outcome = getMailOutcome(summary);
        const isLatestMatch =
            outcome &&
            report.endDate >= connectionTimeBYOE &&
            byoeEmails.has(canonicalizeEmail(report.account)) &&
            report.endDate > latestEndDate;
        if (isLatestMatch) {
            latestOutcome = outcome;
            latestEndDate = report.endDate;
        }
    }

    return latestOutcome;
};
