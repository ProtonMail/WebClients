import { useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useAuthentication } from '@proton/components/index';

import type { ImportIssue, Importer } from 'proton-mail/helpers/contentSearchV2/import/Importer';

// The running importer is kept outside React so it outlives the view: the dialog can be
// closed and reopened, and the next mount reattaches to the still-running import.
let runningImporter: Importer | null = null;

export interface ImporterState {
    /** Whether an import is currently in progress. */
    running: boolean;
    /** Progress as a percentage (0-100). */
    progress: number;
    /** Issues collected so far, newest run first cleared on start. */
    issues: ImportIssue[];
    /** Estimated minutes remaining, or undefined/`∞` while unknown. */
    remainingMinutes: string | undefined;
    /** Start a fresh import, cancelling any previous one. */
    start: () => Promise<void>;
    /** Cancel the running import. */
    stop: () => void;
}

/**
 * Binds the view to the (view-outliving) importer: exposes its observable state and the
 * start/stop verbs, and hides all the subscription/seed/cleanup mechanism.
 */
export function useImporter(): ImporterState {
    const [user] = useUser();
    const authentication = useAuthentication();
    const [importer, setImporter] = useState<Importer | null>(runningImporter);
    const [running, setRunning] = useState(importer?.running ?? false);
    const [progress, setProgress] = useState((importer?.progress ?? 0) * 100);
    const [issues, setIssues] = useState<ImportIssue[]>(importer ? [...importer.issues] : []);
    const [remainingMinutes, setRemainingMinutes] = useState<string | undefined>(
        importer?.remainingMinutes?.toString()
    );

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
            setRemainingMinutes(importer.remainingMinutes?.toString());
            if (!importer.running) {
                setRunning(false);
                if (runningImporter === importer) {
                    runningImporter = null;
                }
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
        if (runningImporter === importer) {
            runningImporter = null;
        }
        setRunning(false);
        setImporter(null);
    };

    const start = async () => {
        runningImporter?.stop();
        setIssues([]);
        setProgress(0);
        // lazy-load content search code
        const { Importer } = await import(
            /* webpackChunkName: "content-search-import" */ 'proton-mail/helpers/contentSearchV2/import/Importer'
        );
        const next = new Importer(user, authentication.getPassword());
        runningImporter = next;
        next.start();
        setRunning(true);
        setImporter(next); // triggers the effect above, which subscribes to the new importer
    };

    return { running, progress, issues, remainingMinutes, start, stop };
}
