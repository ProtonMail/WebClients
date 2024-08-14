import { isFormEntryCommitted, setFormEntryStatus } from 'proton-pass-extension/lib/utils/form-entry';

import { backgroundMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import type { FormEntry, FormEntryBase, FormStatusPayload, Maybe, TabId } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { requestHasBodyFormData } from '@proton/pass/utils/requests';
import { parseSender } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import { createMainFrameRequestTracker } from './main-frame.tracker';
import { createXMLHTTPRequestTracker } from './xmlhttp-request.tracker';

export const createFormTrackerService = () => {
    /** Track form entries for each tab */
    const submissions: Map<TabId, FormEntry> = new Map();

    /** Notifies the tab of the current status of the form. If no XMLHttpRequests
     * were intercepted, we will rely on a content-script timeout to infer the
     * submission. Else we ping the tab to clear the timeout and wait for the
     * form loading state to resolve via the `onIdle` callback of the tracker */
    const syncFormStatus = (tabId: TabId, payload: FormStatusPayload) => {
        browser.tabs
            .sendMessage(tabId, backgroundMessage({ type: WorkerMessageType.FORM_STATUS, payload }))
            .catch(noop);
    };

    const get = (tabId: TabId, domain: string): Maybe<FormEntry> => {
        const submission = submissions.get(tabId);
        if (submission && submission.domain === domain) return submission;
    };

    const stash = (tabId: TabId, reason: string): void => {
        if (submissions.has(tabId)) {
            logger.info(`[FormTracker::Stash]: on tab ${tabId} {${reason}}`);
            submissions.delete(tabId);
        }
    };

    const stage = (tabId: TabId, submission: FormEntryBase, reason: string): FormEntry => {
        logger.info(`[FormTracker::Stage]: on tab ${tabId} for domain "${submission.domain}" {${reason}}`);
        const pending = get(tabId, submission.domain);
        const updatedAt = Date.now();
        const submittedAt = submission.submit ? updatedAt : null;

        const staging = ((): FormEntry => {
            if (pending && pending.status === FormEntryStatus.STAGING) {
                pending.action = submission.action;
                pending.data = merge(pending.data, submission.data, { excludeEmpty: true });
                pending.type = submission.type;
                pending.updatedAt = updatedAt;
                pending.submit = submission.submit;
                pending.submittedAt = submittedAt;

                return pending;
            } else {
                return {
                    ...submission,
                    status: FormEntryStatus.STAGING,
                    submittedAt,
                    updatedAt,
                };
            }
        })();

        submissions.set(tabId, staging);
        return staging;
    };
    const commit = (tabId: TabId, domain: string, reason: string): Maybe<FormEntry<FormEntryStatus.COMMITTED>> => {
        const pending = get(tabId, domain);

        if (pending && pending.status === FormEntryStatus.STAGING) {
            logger.info(`[FormTracker::Commit] on tab ${tabId} for domain "${domain}" {${reason}}`);
            return setFormEntryStatus(pending, FormEntryStatus.COMMITTED);
        } else stash(tabId, 'INVALID_COMMIT');
    };

    const XMLHttpTracker = createXMLHTTPRequestTracker({
        acceptRequest: (details) => {
            const submission = submissions.get(details.tabId);
            if (!submission) return false;

            /* only start tracking requests if the form entry was submitted
             * recently and is not committed. This avoids tracking validation
             * API calls that may occur on websites validating fields */
            const submitted = submission.loading || Date.now() - (submission?.submittedAt ?? 0) < 500;
            if (isFormEntryCommitted(submission) || !submitted) return false;

            if (requestHasBodyFormData(details)) {
                if (!submission.loading) submission.loading = true;
                syncFormStatus(details.tabId, { formId: submission.formId, status: 'loading' });
                return true;
            }

            return false;
        },
        onFailed: ({ tabId, domain }) => {
            const submission = get(tabId, domain);
            if (submission && submission.status === FormEntryStatus.STAGING) {
                submission.submittedAt = null;
                syncFormStatus(tabId, { formId: submission.formId, status: 'error' });
            }
        },
        onIdle: (tabId) => {
            /** If there are no more tracked requests for a tab and there's a valid form
             * entry, notify the tab that the form may have been successfully submitted.
             * At this point, failure inference may not be possible. Add a small timout
             * between each resolved request in order to handle concurrent requests */
            const submission = submissions.get(tabId);

            if (submission && submission.loading) {
                submission.loading = false;
                logger.info(`[FormTracker] Inferred submission on tab ${tabId}`);
                syncFormStatus(tabId, { formId: submission.formId, status: 'submitted' });
            }
        },
    });

    createMainFrameRequestTracker({
        onTabUpdate: (tabId) => XMLHttpTracker.reset(tabId),
        onTabDelete: (tabId) => stash(tabId, 'TAB_DELETED'),
        onTabError: (tabId) => stash(tabId, 'TAB_ERRORED'),
        onTabLoaded: (tabId, method, domain) => {
            /** If the tab was loaded for a `POST` request and we
             * were tracking a form, we can assume something
             * was submitted as part of the form action */
            const submission = get(tabId, domain ?? '');
            if (submission?.domain !== domain) stash(tabId, 'DOMAIN_SWITCH');
            else {
                submission.loading = false;
                if (method === 'POST') submission.submit = true;
            }
        },
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_STAGE,
        withContext((ctx, { payload }, sender) => {
            const { reason, ...staging } = payload;

            if (ctx.getState().authorized) {
                const { tabId, url } = parseSender(sender);
                const { domain, subdomain, protocol: scheme } = url;
                const staged = stage(tabId, { domain, subdomain, scheme, ...staging }, reason);
                const autosave = ctx.service.autosave.resolve(staged);

                return { submission: merge(staged, { autosave }) };
            }

            throw new Error('Cannot stage submission while logged out');
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_STASH,
        withContext((ctx, { payload: { reason } }, sender) => {
            if (ctx.getState().authorized) {
                const { tabId, url } = parseSender(sender);
                if (url.domain) {
                    stash(tabId, reason);
                    return true;
                }
            }

            return false;
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_COMMIT,
        withContext((ctx, { payload: { reason } }, sender) => {
            if (ctx.getState().authorized) {
                const { tabId, url } = parseSender(sender);
                if (url.domain) {
                    const committed = commit(tabId, url.domain, reason);

                    if (committed) {
                        const autosave = ctx.service.autosave.resolve(committed);
                        return {
                            submission: autosave.shouldPrompt
                                ? merge(committed, { autosave })
                                : (() => {
                                      stash(tabId, 'PROMPT_IGNORE');
                                      return null;
                                  })(),
                        };
                    }

                    throw new Error(`Cannot commit form submission for tab#${tabId} on domain "${url.domain}"`);
                }
            }

            throw new Error('Cannot commit submission while logged out');
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_REQUEST,
        withContext(async (ctx, _, sender) => {
            if (ctx.getState().authorized) {
                const { tabId, url } = parseSender(sender);

                if (url.domain) {
                    const submission = get(tabId, url.domain);

                    if (!submission) {
                        stash(tabId, 'REQUEST');
                        return { submission: null };
                    }

                    /* If we intercepted XMLHttpRequests for this submission,
                     * wait for them to resolve to an idle state */
                    await waitUntil(() => !submission.loading, 100).catch(noop);

                    const autosave = isFormEntryCommitted(submission)
                        ? ctx.service.autosave.resolve(submission)
                        : { shouldPrompt: false as const };

                    return { submission: merge(submission, { autosave }) };
                }
            }

            return { submission: null };
        })
    );

    const clear = () => {
        logger.info(`[FormTracker::Clear]: removing every submission`);
        submissions.clear();
    };

    return { get, stage, stash, commit, clear };
};

export type FormTrackerService = ReturnType<typeof createFormTrackerService>;
