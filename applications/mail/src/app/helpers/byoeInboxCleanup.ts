import { ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { Report, ReportSummary } from '@proton/activation/src/logic/reports/reports.interface';
import type { Feature, FeatureCode } from '@proton/features/interface';
import { fetchFeatures, updateFeature } from '@proton/features/reducer';
import { CacheType } from '@proton/redux-utilities/interface';
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
import noop from '@proton/utils/noop';

import type { MailDispatch } from '../store/store';

const MAX_BYOE_INBOX_CLEANUP_SENDERS = 10;

/**
 * Never-read senders first, then the ones read longest ago, then the ones with the most unread messages.
 * Written out because `getPaginationQueryString` has no way to sort on `LastReadTime`.
 */
export const BYOE_INBOX_CLEANUP_SENDERS_QUERY =
    'PageSize=100&Active=1&Spam=0&Sort[LastReadTime]=ASC&Sort[UnreadMessageCount]=DESC&Sort[ID]=DESC';

/**
 * Reads one page only: the next page is rejected by the server when the last sender of this one was never read.
 * Rejects when the request fails, so the caller can tell a failure apart from there being no senders.
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

export type BYOEInboxCleanupSection = 'never' | 'sometimes' | 'often';

export interface BYOEInboxCleanupSenderGroup {
    section: BYOEInboxCleanupSection;
    subscriptions: NewsletterSubscription[];
}

const BYOE_INBOX_CLEANUP_SECTIONS: BYOEInboxCleanupSection[] = ['never', 'sometimes', 'often'];

/**
 * Puts a newsletter in a section by how much of its mail the person has opened:
 * - never: no email from this newsletter has ever been read. Based on `LastReadTime` rather than the counts,
 *   so deleting unread mail can't move it out of this section.
 * - often: half or more of the emails received from this newsletter have been opened (received minus unread).
 * - sometimes: everything else.
 * The server starts the received count at 1, so the opened share never divides by 0.
 */
const getBYOEInboxCleanupSection = ({
    LastReadTime,
    ReceivedMessageCount,
    UnreadMessageCount,
}: NewsletterSubscription): BYOEInboxCleanupSection => {
    if (!LastReadTime) {
        return 'never';
    }

    const openedShare = (ReceivedMessageCount - UnreadMessageCount) / ReceivedMessageCount;
    return openedShare >= 0.5 ? 'often' : 'sometimes';
};

/**
 * Splits the senders into never, sometimes and often opened, in that order, leaving out empty sections.
 * Senders keep the order they arrive in within a section.
 */
export const groupBYOEInboxCleanupSenders = (
    subscriptions: NewsletterSubscription[]
): BYOEInboxCleanupSenderGroup[] => {
    // e.g. { never: [a, c], often: [b] }: empty sections have no key, and keys are in first-seen order
    const subscriptionsBySection = Object.groupBy(subscriptions, getBYOEInboxCleanupSection);

    return BYOE_INBOX_CLEANUP_SECTIONS.flatMap((section) => {
        const sectionSubscriptions = subscriptionsBySection[section];
        return sectionSubscriptions ? [{ section, subscriptions: sectionSubscriptions }] : [];
    });
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

/** The per-user codes that say the BYOE cleanup window or its Mailing lists spotlight is due after a BYOE import */
export type BYOEImportFeatureCode = FeatureCode.BYOEInboxCleanupModal | FeatureCode.BYOEInboxCleanupSpotlight;

/**
 * Marks the cleanup window or its Mailing lists spotlight as no longer due, so it doesn't show again until another BYOE
 * connection with import. A failed request puts the value back, so it shows again on the next load.
 */
export const clearBYOEFeature = (dispatch: MailDispatch, featureCode: BYOEImportFeatureCode) => {
    dispatch(updateFeature(featureCode, false)).catch(noop);
};

/**
 * Whether the BYOE cleanup (or its Mailing lists spotlight) is still due, read fresh from the server. The value from
 * `useFeature` is cached from page load and isn't updated by events, so another tab or device may have shown or cleared
 * it since.
 */
export const fetchIsBYOEFeatureDue = async (dispatch: MailDispatch, featureCode: BYOEImportFeatureCode) => {
    const features = await dispatch(fetchFeatures([featureCode], { cache: CacheType.None }));
    return features[featureCode].Value === true;
};

/**
 * Reads the code fresh and, if it's still due, loads the cleanup's senders. Resolves to `undefined` when it's no longer
 * due, and to an empty list when there are no senders. Either request failing rejects, so a failure is never taken for
 * "no senders". The senders load last, so the list is current when it's shown.
 */
export const fetchSendersIfStillDue = async (
    dispatch: MailDispatch,
    api: Api,
    featureCode: BYOEImportFeatureCode
): Promise<NewsletterSubscription[] | undefined> => {
    const isStillDue = await fetchIsBYOEFeatureDue(dispatch, featureCode);
    if (!isStillDue) {
        return undefined;
    }

    return getBYOEInboxCleanupSenders(api);
};
