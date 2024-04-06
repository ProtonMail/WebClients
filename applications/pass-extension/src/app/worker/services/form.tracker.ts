import { isFormEntryCommitted, setFormEntryStatus } from 'proton-pass-extension/lib/utils/form-entry';

import type { FormEntry, FormEntryBase, Maybe, TabId } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { requestHasBodyFormData } from '@proton/pass/utils/requests';
import { parseSender } from '@proton/pass/utils/url/parser';
import { wait } from '@proton/shared/lib/helpers/promise';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import { createMainFrameRequestTracker } from './main-frame.tracker';
import { createXMLHTTPRequestTracker } from './xmlhttp-request.tracker';

export const createFormTrackerService = () => {
    /** Track form entries for each tab */
    const submissions: Map<TabId, FormEntry> = new Map();

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

        const staging = ((): FormEntry => {
            if (pending && pending.status === FormEntryStatus.STAGING) {
                pending.action = submission.action;
                pending.data = merge(pending.data, submission.data, { excludeEmpty: true });
                pending.submitted = pending.submitted || submission.submitted;
                pending.type = submission.type;
                pending.updatedAt = Date.now();
                return pending;
            } else return { ...submission, status: FormEntryStatus.STAGING, updatedAt: Date.now() };
        })();

        submissions.set(tabId, staging);
        return staging;
    };

    /** Comitting a `FormEntry` will automatically flag it as `submitted` */
    const commit = (tabId: TabId, domain: string, reason: string): Maybe<FormEntry<FormEntryStatus.COMMITTED>> => {
        const pending = get(tabId, domain);

        if (pending && pending.status === FormEntryStatus.STAGING) {
            logger.info(`[FormTracker::Commit] on tab ${tabId} for domain "${domain}" {${reason}}`);
            pending.submitted = true;
            return setFormEntryStatus(pending, FormEntryStatus.COMMITTED);
        } else stash(tabId, 'INVALID_COMMIT');
    };

    createMainFrameRequestTracker({
        onTabDelete: (tabId) => stash(tabId, 'TAB_DELETED'),
        onTabError: (tabId) => stash(tabId, 'TAB_ERRORED'),
        onTabLoaded: (tabId, method, domain) => {
            /** If the tab was loaded for a `POST` request and we
             * were tracking a form, we can assume something
             * was submitted as part of the form action */
            const submission = get(tabId, domain ?? '');
            if (submission?.domain !== domain) stash(tabId, 'DOMAIN_SWITCH');
            else if (method === 'POST') submission.submitted = true;
        },
    });

    createXMLHTTPRequestTracker({
        acceptRequest: (details) => {
            const submission = submissions.get(details.tabId);
            if (!submission) return false;

            if (requestHasBodyFormData(details)) {
                /** if the form was not flagged as submitted - infer submission from this potential
                 * network request interception. If it is "close" enough to the submission's `updatedAt`
                 * timestamp, we can consider something of interest happened during this timeframe and
                 * as such flag the submission as `submitted` */
                if (Date.now() - submission.updatedAt < 500) {
                    logger.info(`[FormTracker::XMLHttp] inferred submission on tab ${details.tabId}`);
                    submission.submitted = true;
                }
                return true;
            }

            return false;
        },
        onFailedRequest: ({ tabId, domain }) => {
            const submission = get(tabId, domain);
            if (submission && submission.status === FormEntryStatus.STAGING) {
                submission.submitted = false;
                stash(tabId, 'XMLHTTP_ERROR_DETECTED');
            }
        },
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_STAGE,
        withContext((ctx, { payload }, sender) => {
            const { reason, ...staging } = payload;

            if (ctx.getState().loggedIn) {
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
            if (ctx.getState().loggedIn) {
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
            if (ctx.getState().loggedIn) {
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
            if (ctx.getState().loggedIn) {
                const { tabId, url } = parseSender(sender);

                if (url.domain) {
                    const submission = get(tabId, url.domain);

                    if (!submission) {
                        stash(tabId, 'REQUEST');
                        return { submission: null };
                    }

                    /** If the form was not submitted, add a short timeout before
                     * resolving the response to intercept possible XMLHttpRequests */
                    await wait(submission.submitted ? 0 : 250);
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
