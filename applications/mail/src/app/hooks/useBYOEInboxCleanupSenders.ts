import { useEffect, useRef, useState } from 'react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { loadReports } from '@proton/activation/src/logic/reports/reports.actions';
import {
    selectReportEntriesByDate,
    selectReportsLoading,
} from '@proton/activation/src/logic/reports/reports.selectors';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useApi } from '@proton/app-context/useApi';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { clearBYOEInboxCleanup, getFinishedBYOEImportOutcome, loadSendersWhenFree } from '../helpers/byoeInboxCleanup';
import { useMailDispatch } from '../store/hooks';

/**
 * Returns the senders for the BYOE inbox cleanup window once it should open, and `undefined` until then: when the
 * import into a newly connected BYOE address has finished, onboarding is done and `canShow` is true.
 *
 * The cleanup is due while its feature value is true. Connecting BYOE sets it; closing the window clears it, and this
 * hook clears it when the import failed or there are no senders. The value is read once per load and the senders once
 * per visit to Mailing lists.
 */
const useBYOEInboxCleanupSenders = (canShow: boolean): NewsletterSubscription[] | undefined => {
    const isCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const { feature } = useFeature<boolean>(FeatureCode.BYOEInboxCleanupModal, isCleanupEnabled);
    const dispatch = useMailDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();
    const reportEntries = useEasySwitchSelector(selectReportEntriesByDate);
    const reportsLoading = useEasySwitchSelector(selectReportsLoading);
    const [addresses = []] = useAddresses();
    const { welcomeFlags } = useWelcomeFlags();
    const api = useApi();
    const [senders, setSenders] = useState<NewsletterSubscription[]>();

    // Handled once per visit, so the senders aren't loaded twice and a failed clear putting the value back isn't retried
    const hasHandledCleanupRef = useRef(false);

    const isCleanupDue = isCleanupEnabled && feature?.Value === true;
    const importOutcome = isCleanupDue
        ? getFinishedBYOEImportOutcome({ entries: reportEntries, addresses, feature })
        : undefined;
    const isOnboardingDone = welcomeFlags.isDone;

    useEffect(() => {
        if (isCleanupDue && reportsLoading === 'idle') {
            void easySwitchDispatch(loadReports());
        }
    }, [isCleanupDue, reportsLoading, easySwitchDispatch]);

    useEffect(() => {
        if (!importOutcome || hasHandledCleanupRef.current) {
            return;
        }

        if (importOutcome === 'failed') {
            hasHandledCleanupRef.current = true;
            clearBYOEInboxCleanup(dispatch);
            return;
        }

        if (!isOnboardingDone || !canShow) {
            return;
        }

        const controller = new AbortController();

        const loadSenders = async () => {
            const subscriptions = await loadSendersWhenFree({ dispatch, api, signal: controller.signal });
            if (!subscriptions) {
                return;
            }

            hasHandledCleanupRef.current = true;
            if (subscriptions.length === 0) {
                clearBYOEInboxCleanup(dispatch);
                return;
            }

            setSenders(subscriptions);
        };

        // A failed request leaves the cleanup due, to be tried again on the next visit
        loadSenders().catch(noop);

        return () => {
            controller.abort();
        };
    }, [importOutcome, isOnboardingDone, canShow, dispatch, api]);

    return senders;
};

export default useBYOEInboxCleanupSenders;
