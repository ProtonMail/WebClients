import { useEffect, useRef } from 'react';

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
import { updateFeature } from '@proton/features/reducer';
import useFeature from '@proton/features/useFeature';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { useMailGlobalModals } from '../containers/globalModals/globalModalContext';
import { ModalType } from '../containers/globalModals/inteface';
import { getFinishedBYOEImportOutcome, loadSendersWhenFree } from '../helpers/byoeInboxCleanup';
import { useMailDispatch } from '../store/hooks';
import type { MailDispatch } from '../store/store';
import useBYOEInboxCleanupConfirm from './useBYOEInboxCleanupConfirm';

const CLEANUP_FEATURE = FeatureCode.BYOEInboxCleanupModal;

const clearCleanup = (dispatch: MailDispatch) => {
    dispatch(updateFeature(CLEANUP_FEATURE, false)).catch(noop);
};

/**
 * Offers the BYOE inbox cleanup once the import into a newly connected BYOE address has finished.
 * The feature value is set when someone connects BYOE. Mail reads it once per load, so a connection made in another
 * tab while this one stays open is offered on the next load; one made in this tab is offered without a reload.
 */
const useShowBYOEInboxCleanupModal = () => {
    const isCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const { feature } = useFeature<boolean>(CLEANUP_FEATURE, isCleanupEnabled);
    const dispatch = useMailDispatch();
    const easySwitchDispatch = useEasySwitchDispatch();
    const reportEntries = useEasySwitchSelector(selectReportEntriesByDate);
    const reportsLoading = useEasySwitchSelector(selectReportsLoading);
    const [addresses = []] = useAddresses();
    const { welcomeFlags } = useWelcomeFlags();
    const api = useApi();
    const { notify } = useMailGlobalModals();
    const createBYOEInboxCleanupConfirm = useBYOEInboxCleanupConfirm();

    // A change of this mustn't restart loading the senders
    const createConfirmRef = useRef(createBYOEInboxCleanupConfirm);
    createConfirmRef.current = createBYOEInboxCleanupConfirm;

    // Offered or cleared once per load, so a failed clear putting the value back doesn't loop
    const hasHandledCleanupRef = useRef(false);

    // Flag is enabled and BYOE connection is complete - true
    const isCleanupDue = isCleanupEnabled && feature?.Value === true;
    const importOutcome = isCleanupDue
        ? getFinishedBYOEImportOutcome({ entries: reportEntries, addresses, feature })
        : undefined;
    const isOnboardingDone = welcomeFlags.isDone;

    // Fetching the reports if clean up is due
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
            clearCleanup(dispatch);
            return;
        }

        if (!isOnboardingDone) {
            return;
        }

        const controller = new AbortController();

        const offerCleanup = async () => {
            const subscriptions = await loadSendersWhenFree({ dispatch, api, signal: controller.signal });
            if (!subscriptions) {
                return;
            }

            hasHandledCleanupRef.current = true;
            if (subscriptions.length === 0) {
                clearCleanup(dispatch);
                return;
            }

            notify({
                type: ModalType.BYOEInboxCleanup,
                value: {
                    subscriptions,
                    onConfirm: createConfirmRef.current(),
                    onDisplayed: () => {
                        clearCleanup(dispatch);
                    },
                },
            });
        };

        // A failed request leaves the cleanup due, to be offered on the next load
        offerCleanup().catch(noop);

        return () => {
            controller.abort();
        };
    }, [importOutcome, isOnboardingDone, dispatch, api, notify]);
};

export default useShowBYOEInboxCleanupModal;
