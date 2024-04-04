import { getFormId, isFormEntryCommitted } from 'proton-pass-extension/lib/utils/form-entry';

import type { FormEntry, FormEntryBase, FormIdentifier, Maybe, TabId } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { requestHasBodyFormData } from '@proton/pass/utils/requests';
import { parseSender } from '@proton/pass/utils/url/parser';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import { createMainFrameRequestTracker } from './main-frame.tracker';
import { createXMLHTTPRequestTracker } from './xmlhttp-request.tracker';

export const createFormTrackerService = () => {
    const submissions: Map<FormIdentifier, FormEntry> = new Map();

    const get = (tabId: TabId, domain: string): Maybe<FormEntry> => {
        const submission = submissions.get(getFormId(tabId, domain));
        if (submission && submission.domain === domain) return submission;
    };

    const stash = (tabId: TabId, domain: string, reason: string): void => {
        const formId = getFormId(tabId, domain);

        if (submissions.has(formId)) {
            logger.info(`[FormTracker::Stash]: on tab ${tabId} for domain "${domain}" {${reason}}`);
            submissions.delete(formId);
        }
    };

    const stage = (tabId: TabId, submission: FormEntryBase, reason: string): FormEntry => {
        logger.info(`[FormTracker::Stage]: on tab ${tabId} for domain "${submission.domain}" {${reason}}`);

        const formId = getFormId(tabId, submission.domain);
        const pending = submissions.get(formId);

        if (pending !== undefined && pending.status === FormEntryStatus.STAGING) {
            /* do not override empty values when merging in order to properly
             * support multi-step forms which may have partial data on each step */
            const staging = merge(pending, { ...submission, status: FormEntryStatus.STAGING }, { excludeEmpty: true });
            submissions.set(formId, staging);
            return staging;
        }

        const staging = merge(submission, { status: FormEntryStatus.STAGING });
        submissions.set(formId, staging);
        return staging;
    };

    const commit = (tabId: TabId, domain: string, reason: string): Maybe<FormEntry<FormEntryStatus.COMMITTED>> => {
        const formId = getFormId(tabId, domain);
        const pending = submissions.get(formId);

        if (pending !== undefined && pending.status === FormEntryStatus.STAGING) {
            logger.info(`[FormTracker::Commit] on tab ${tabId} for domain "${domain}" {${reason}}`);
            const commit = merge(pending, { status: FormEntryStatus.COMMITTED as const });
            submissions.set(formId, commit);
            return commit;
        }
    };

    createMainFrameRequestTracker({
        onTabDelete: (tabId) => {
            submissions.forEach((_, key) => {
                if (key.startsWith(tabId.toString())) {
                    const [tabId, domain] = key.split(':');
                    stash(parseInt(tabId, 10), domain, 'TAB_DELETED');
                }
            });
        },
        onTabError: (tabId, domain) => domain && stash(tabId, domain, 'TAB_ERRORED'),
    });

    /* TODO: on failed request we should send out
     * a message to the content-script : we should stash
     * only if there was a recent form submission - if
     * we directly stash we might get false positives  */
    createXMLHTTPRequestTracker({
        acceptRequest: requestHasBodyFormData,
        onFailedRequest: ({ tabId, domain }) => {
            const submission = get(tabId, domain);
            if (submission && submission.status === FormEntryStatus.STAGING) {
                stash(tabId, domain, 'XMLHTTP_ERROR_DETECTED');
            }
        },
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_STAGE,
        withContext((ctx, { payload }, sender) => {
            const { type, data } = payload;

            if (ctx.getState().loggedIn) {
                const { tabId, url } = parseSender(sender);
                const { domain, subdomain, protocol: scheme } = url;
                const staged = stage(tabId, { domain, subdomain, scheme, type, data }, payload.reason);
                const autosave = ctx.service.autosave.shouldPrompt(staged);

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
                    stash(tabId, url.domain, reason);
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

                    if (committed !== undefined) {
                        const autosave = ctx.service.autosave.shouldPrompt(committed);

                        return autosave.shouldPrompt
                            ? { submission: merge(committed, { autosave }) }
                            : (() => {
                                  stash(tabId, url.domain, 'PROMPT_IGNORE');
                                  return { submission: null };
                              })();
                    }

                    throw new Error(`Cannot commit form submission for tab#${tabId} on domain "${url.domain}"`);
                }
            }

            throw new Error('Cannot commit submission while logged out');
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.FORM_ENTRY_REQUEST,
        withContext((ctx, _, sender) => {
            if (ctx.getState().loggedIn) {
                const { tabId, url } = parseSender(sender);

                if (url.domain) {
                    const submission = get(tabId, url.domain);
                    const isCommitted = submission !== undefined && isFormEntryCommitted(submission);

                    return {
                        submission:
                            submission !== undefined
                                ? merge(submission, {
                                      autosave: isCommitted
                                          ? ctx.service.autosave.shouldPrompt(submission)
                                          : { shouldPrompt: false as const },
                                  })
                                : null,
                    };
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
