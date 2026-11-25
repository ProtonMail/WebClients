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
import useFeature from '@proton/features/useFeature';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import type { BYOEImportFeatureCode } from '../helpers/byoeInboxCleanup';
import { clearBYOEFeature, fetchSendersIfStillDue, getFinishedBYOEImportOutcome } from '../helpers/byoeInboxCleanup';
import { useMailDispatch } from '../store/hooks';

/**
 * Returns the inbox cleanup's senders once the import into a newly connected BYOE address has finished, onboarding is
 * done and `canShow` is true, and `undefined` until then. Shared by the cleanup window and the Mailing lists spotlight,
 * each with its own feature code.
 *
 * Something is due while its feature value is true. Connecting BYOE sets it, and its update time matches the import.
 * This hook clears it when the import failed or there are no senders; otherwise the caller clears it once it has shown.
 * The value is read fresh again right before the senders load, so what another tab or device has already shown or
 * cleared isn't shown twice. The senders load once per mount.
 */
const useFinishedBYOEImportSenders = (
    featureCode: BYOEImportFeatureCode,
    canShow: boolean
): NewsletterSubscription[] | undefined => {
    const isCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const { feature } = useFeature<boolean>(featureCode, isCleanupEnabled);
    const dispatch = useMailDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();
    const reportEntries = useEasySwitchSelector(selectReportEntriesByDate);
    const reportsLoading = useEasySwitchSelector(selectReportsLoading);
    const [addresses = []] = useAddresses();
    const { welcomeFlags } = useWelcomeFlags();
    const api = useApi();
    const [senders, setSenders] = useState<NewsletterSubscription[]>();

    // Handled once per mount, so the senders aren't loaded twice and a failed clear putting the value back isn't retried
    const hasHandledRef = useRef(false);

    const isDue = isCleanupEnabled && feature?.Value === true;
    const importOutcome = isDue
        ? getFinishedBYOEImportOutcome({ entries: reportEntries, addresses, feature })
        : undefined;
    const isOnboardingDone = welcomeFlags.isDone;

    useEffect(() => {
        if (isDue && reportsLoading === 'idle') {
            void easySwitchDispatch(loadReports());
        }
    }, [isDue, reportsLoading, easySwitchDispatch]);

    useEffect(() => {
        if (!importOutcome || hasHandledRef.current) {
            return;
        }

        if (importOutcome === 'failed') {
            hasHandledRef.current = true;
            clearBYOEFeature(dispatch, featureCode);
            return;
        }

        if (!isOnboardingDone || !canShow) {
            return;
        }

        // Set when this effect is cleaned up (unmounted, or a dependency changed), so a load still in flight is ignored
        let isCancelled = false;

        const loadSenders = async () => {
            const subscriptions = await fetchSendersIfStillDue(dispatch, api, featureCode);
            if (isCancelled || !subscriptions) {
                return;
            }

            hasHandledRef.current = true;
            if (subscriptions.length === 0) {
                clearBYOEFeature(dispatch, featureCode);
                return;
            }

            setSenders(subscriptions);
        };

        // A failed request leaves it due, to be tried again on the next mount
        loadSenders().catch(noop);

        return () => {
            isCancelled = true;
        };
    }, [importOutcome, isOnboardingDone, canShow, featureCode, dispatch, api]);

    return senders;
};

export default useFinishedBYOEImportSenders;
