import { useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';

import type { ImportIssue } from './Import';
import type { ImportHandle } from './ImportHandle';

import { getSharedIndexService } from '../indexation/IndexService';

export interface ImporterState {
    /** Whether an import is currently in progress. */
    running: boolean;
    /** Progress as a percentage (0-100). */
    progress: number;
    /** Issues collected so far, newest run first cleared on start. */
    issues: ImportIssue[];
    /** Estimated minutes remaining, or undefined/`∞` while unknown. */
    remainingMinutes: string;
    /** Start a fresh import, cancelling any previous one. */
    start: () => Promise<void>;
    /** Cancel the running import. */
    stop: () => void;
}

const getRemainingMinutesFromImporter = (importer: ImportHandle | undefined) =>
    importer?.remainingMinutes?.toString() ?? '∞';
/**
 * Binds the view to the (view-outliving) importer: exposes its observable state and the
 * start/stop verbs, and hides all the subscription/seed/cleanup mechanism.
 */
export function useImporter(): ImporterState {
    const [user] = useUser();
    const getUserKeys = useGetUserKeys();
    const [importer, setImporter] = useState<ImportHandle | undefined>(
        getSharedIndexService(user.ID, getUserKeys).currentImport
    );
    const [running, setRunning] = useState(importer?.running ?? false);
    const [progress, setProgress] = useState((importer?.progress ?? 0) * 100);
    const [issues, setIssues] = useState<ImportIssue[]>(importer ? importer.issues : []);
    const [remainingMinutes, setRemainingMinutes] = useState<string>(getRemainingMinutesFromImporter(importer));

    useEffect(() => {
        if (!importer) {
            return;
        }

        // Listeners don't replay, and we may be reattaching to an import that progressed
        // while the dialog was closed, so seed from the importer's current state before
        // subscribing. This also closes the gap between `start()` and this subscription.
        setProgress(importer.progress * 100);
        setIssues([...importer.issues]);
        setRemainingMinutes('∞');
        setRunning(importer.running);

        const unsubscribeProgress = importer.onProgress.subscribe((value) => {
            setProgress(value * 100);
            setRemainingMinutes(getRemainingMinutesFromImporter(importer));
            if (!importer.running) {
                setRunning(false);
            }
        });
        // The importer notifies with the same array instance, so copy it to force a render.
        const unsubscribeIssue = importer.onIssue.subscribe((next) => {
            setIssues([...next]);
        });

        return () => {
            unsubscribeProgress();
            unsubscribeIssue();
        };
    }, [importer]);

    const stop = () => {
        importer?.stop();
        setRunning(false);
        setImporter(undefined);
    };

    const start = async () => {
        setIssues([]);
        setProgress(0);
        setRunning(true);
        const indexService = getSharedIndexService(user.ID, getUserKeys);
        const importer = await indexService.importFromEncryptedSearch();
        setImporter(importer); // triggers the effect above, which subscribes to the new importer
    };

    return { running, progress, issues, remainingMinutes, start, stop };
}
