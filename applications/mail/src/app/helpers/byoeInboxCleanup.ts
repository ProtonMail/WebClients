import { ApiImporterState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import type { Report, ReportSummary } from '@proton/activation/src/logic/reports/reports.interface';
import type { Feature } from '@proton/features/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getNewsletterSubscription } from '@proton/shared/lib/api/newsletterSubscription';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type {
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
