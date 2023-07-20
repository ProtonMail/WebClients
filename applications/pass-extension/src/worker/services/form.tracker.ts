import { FormType } from '@proton/pass/fathom';
import type { FormEntry, FormIdentifier, Maybe, TabId, WithAutoSavePromptOptions } from '@proton/pass/types';
import { FormEntryStatus, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object';
import { parseSender } from '@proton/pass/utils/url';

import { canCommitSubmission, isSubmissionCommitted } from '../../shared/form';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import { createMainFrameRequestTracker } from './main-frame.tracker';
import { createXMLHTTPRequestTracker } from './xmlhttp-request.tracker';

const isPartialFormData = ({ type, data }: Pick<FormEntry, 'data' | 'type'>): boolean => {
    switch (type) {
        case FormType.LOGIN:
        case FormType.REGISTER: {
            return !(data.username?.trim() && data.password?.trim());
        }
        default:
            return false;
    }
};

const getFormId = (tabId: TabId, domain: string): FormIdentifier => `${tabId}:${domain}`;

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

    const stage = (tabId: TabId, submission: Omit<FormEntry, 'status' | 'partial'>, reason: string): FormEntry => {
        logger.info(`[FormTracker::Stage]: on tab ${tabId} for domain "${submission.domain}" {${reason}}`);

        const formId = getFormId(tabId, submission.domain);
        const pending = submissions.get(formId);

        if (pending !== undefined && pending.status === FormEntryStatus.STAGING) {
            /* do not override empty values when merging in order to properly
             * support multi-step forms which may have partial data on each step */
            const update = merge(pending, { ...submission, status: FormEntryStatus.STAGING }, { excludeEmpty: true });
            const staging = merge(update, { partial: isPartialFormData(update) });

            submissions.set(formId, staging);
            return staging;
        }

        const staging = merge(submission, {
            status: FormEntryStatus.STAGING,
            partial: isPartialFormData(submission),
        }) as FormEntry;

        submissions.set(formId, staging);
        return staging;
    };

    const commit = (tabId: TabId, domain: string, reason: string): Maybe<FormEntry<FormEntryStatus.COMMITTED>> => {
        const formId = getFormId(tabId, domain);
        const pending = submissions.get(formId);

        if (pending !== undefined && pending.status === FormEntryStatus.STAGING) {
            logger.info(`[FormTracker::Commit] on tab ${tabId} for domain "${domain}" {${reason}}`);
            const commit = merge(pending, { status: FormEntryStatus.COMMITTED });

            if (canCommitSubmission(commit)) {
                submissions.set(formId, commit);
                return commit;
            }
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

    /**
     * TODO: on failed request we should send out
     * a message to the content-script : we should stash
     * only if there was a recent form submission - if
     * we directly stash we might get false positives
     */
    createXMLHTTPRequestTracker({
        shouldTakeRequest: (tabId, domain) => submissions.has(getFormId(tabId, domain)),
        onFailedRequest: (tabId, domain) => {
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
                if (url.domain) {
                    return {
                        staged: stage(
                            tabId,
                            {
                                domain: url.domain,
                                subdomain: url.subdomain,
                                type,
                                data,
                            },
                            payload.reason
                        ),
                    };
                }
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
                        const promptOptions = ctx.service.autosave.resolvePromptOptions(committed);

                        return promptOptions.shouldPrompt
                            ? { committed: merge(committed, { autosave: promptOptions }) }
                            : (() => {
                                  stash(tabId, url.domain, 'PROMPT_IGNORE');
                                  return { committed: undefined };
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
                    const isCommitted = submission !== undefined && isSubmissionCommitted(submission);

                    return {
                        submission:
                            submission !== undefined
                                ? (merge(submission, {
                                      autosave: isCommitted
                                          ? ctx.service.autosave.resolvePromptOptions(submission)
                                          : { shouldPrompt: false },
                                  }) as WithAutoSavePromptOptions<FormEntry>)
                                : submission,
                    };
                }
            }

            return { submission: undefined };
        })
    );

    const clear = () => {
        logger.info(`[FormTracker::Clear]: removing every submission`);
        submissions.clear();
    };

    return { get, stage, stash, commit, clear };
};

export type FormTrackerService = ReturnType<typeof createFormTrackerService>;
