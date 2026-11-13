import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { GenerationInterruptedError, ToolRetryConfirmationRequiredError } from '@proton/lumo-api-client/core/recovery';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import { resolveClientToolExecutor } from '../components/Conversation/compactionFlow';
import { createRetrievalAnalysis } from '../components/Conversation/helper';
import { useSafeUser } from '../contexts/SafeUserContext';
import { base64ToSpaceKey } from '../crypto';
import { restoreRetrievalContext } from '../features/client-tools/retrievalTool/recovery';
import { getSkillLookupPool } from '../features/skills/skillSelection';
import { sendMessageWithRedux } from '../lib/lumoApiClientRedux';
import { useLumoSelector, useLumoStore } from '../redux/hooks';
import { selectMasterKey } from '../redux/selectors';
import { addAttachment, pushAttachmentRequest } from '../redux/slices/core/attachments';
import { addConversation, updateConversationStatus } from '../redux/slices/core/conversations';
import { addMessage, finishMessage, pushMessageRequest } from '../redux/slices/core/messages';
import { addSpace } from '../redux/slices/core/spaces';
import { extraThunkArguments } from '../redux/thunk';
import { attachmentDataCache } from '../services/attachmentDataCache';
import { OPERATION_IN_PROGRESS_MESSAGE, generationRegistry } from '../services/generation/generationRegistry';
import {
    cancelGenerationJobs,
    finalizeGenerationRecovery,
    generationRecoveryStore,
    logGenerationRecoveryError,
} from '../services/generation/recovery';
import type { RecoveryRecord } from '../services/generation/recovery';
import { restoreRecoveryAttachment } from '../services/generation/recoveryAttachments';
import { ConversationStatus, SpaceType } from '../types';
import { useLumoFlags } from './useLumoFlags';

type RecoveryStore = ReturnType<typeof useLumoStore>;

function finishExpiredGeneration(store: RecoveryStore, id: string): void {
    if (generationRegistry.isInProgress(id)) {
        return;
    }
    const state = store.getState();
    const spaceId = state.conversations[id]?.spaceId;
    if (!spaceId) {
        return;
    }
    for (const message of Object.values(state.messages)) {
        if (message.conversationId === id && message.placeholder) {
            store.dispatch(
                finishMessage({
                    messageId: message.id,
                    conversationId: id,
                    spaceId,
                    content: message.content ?? '',
                    status: 'failed',
                    role: message.role,
                })
            );
        }
    }
    store.dispatch(updateConversationStatus({ id, status: ConversationStatus.COMPLETED }));
}

async function restoreCheckpoint(store: RecoveryStore, record: RecoveryRecord): Promise<boolean> {
    const id = record.conversation.id;
    const state = store.getState();
    const localConversation = await extraThunkArguments.dbApi?.getConversationById(id);
    if (localConversation?.deleted) {
        await generationRecoveryStore().remove(id, record.checkpoint.jobId);
        return false;
    }
    if (!state.spaces[record.space.id]) {
        store.dispatch(addSpace(record.space));
    }
    if (!state.conversations[id]) {
        store.dispatch(addConversation(record.conversation));
    }
    for (const entry of record.attachments) {
        const attachment = await restoreRecoveryAttachment(entry, extraThunkArguments.dbApi);
        if (!store.getState().attachments[attachment.id]) {
            store.dispatch(addAttachment(attachment));
        }
    }
    for (const message of record.ancestors) {
        if (!store.getState().messages[message.id]) {
            store.dispatch(addMessage(message));
        }
    }
    return true;
}

async function saveRecoveredCompletion(api: Api, store: RecoveryStore, record: RecoveryRecord): Promise<void> {
    store.dispatch(addMessage({ ...record.message, placeholder: false, status: record.message.status ?? 'succeeded' }));
    if (record.message.placeholder || !extraThunkArguments.dbApi) {
        await finalizeGenerationRecovery(record.conversation.id, store.getState(), api);
    }
    store.dispatch(updateConversationStatus({ id: record.conversation.id, status: ConversationStatus.COMPLETED }));
    if (store.getState().credentials.masterKeyState.status !== 'ready' || record.conversation.ghost) {
        return;
    }
    for (const { attachment } of record.attachments) {
        if (
            attachmentDataCache.hasData(attachment.id) &&
            !store.getState().idmap.local2remote.attachment[attachment.id]
        ) {
            store.dispatch(pushAttachmentRequest({ id: attachment.id }));
        }
    }
    store.dispatch(pushMessageRequest({ id: record.message.id }));
}

async function resumeCheckpoint(
    api: Api,
    store: RecoveryStore,
    record: RecoveryRecord,
    confirmToolRetry: () => Promise<boolean>,
    controller: AbortController,
    userId?: string
): Promise<void> {
    const id = record.conversation.id;
    try {
        store.dispatch(addMessage(record.message));
        store.dispatch(updateConversationStatus({ id, status: ConversationStatus.GENERATING }));
        const sendOptions = {
            ...record.options,
            retrievalTools:
                record.retrieval &&
                restoreRetrievalContext({
                    recovery: record.retrieval,
                    conversationId: id,
                    spaceId: record.space.id,
                    getState: store.getState,
                    userId,
                    analysis: {
                        analyze: createRetrievalAnalysis(
                            api,
                            controller.signal,
                            record.config?.enableU2LEncryption ?? true
                        ),
                        signal: controller.signal,
                    },
                }),
            retrievalExecutionState: record.retrieval?.execution,
        };
        const { executor, retrieval } = resolveClientToolExecutor(sendOptions, store.dispatch, () => {
            const state = store.getState();
            const space = state.spaces[record.space.id];
            const scheduleRefs =
                space?.spaceType === SpaceType.Schedule ? (space.schedule.skillIdsOrSubSkillRefs ?? []) : [];
            return getSkillLookupPool(Object.values(state.skills.skills), scheduleRefs);
        });
        await store.dispatch(
            sendMessageWithRedux(api, record.checkpoint.turns, {
                ...sendOptions,
                getRetrievalExecutionState: retrieval?.getRecoveryState,
                config: record.config,
                recoveryRecord: record,
                resume: record.checkpoint,
                requestId: record.requestId,
                requestKey: record.requestKey ? await base64ToSpaceKey(record.requestKey, true) : undefined,
                clientToolExecutor: executor,
                messageId: record.message.id,
                conversationId: id,
                spaceId: record.space.id,
                signal: controller.signal,
                confirmToolRetry,
            })
        );
    } catch (error) {
        if (!(error instanceof GenerationInterruptedError) && !(error instanceof ToolRetryConfirmationRequiredError)) {
            logGenerationRecoveryError('resume', error);
            store.dispatch(updateConversationStatus({ id, status: ConversationStatus.COMPLETED }));
        }
    } finally {
        generationRegistry.finish(id, controller);
    }
}

interface RecoveryAttempt {
    api: Api;
    store: RecoveryStore;
    id: string;
    conversationId: string | undefined;
    userId: string | undefined;
    isActive: () => boolean;
    paused: ReadonlySet<string>;
    saveCompletion: (record: RecoveryRecord) => Promise<void>;
    confirmToolRetry: () => Promise<boolean>;
}

async function observeCheckpoint(attempt: RecoveryAttempt): Promise<void> {
    const record = await generationRecoveryStore().get<RecoveryRecord>(attempt.id);
    if (!record || record.conversation.ghost || !attempt.isActive()) {
        return;
    }
    if (!(await restoreCheckpoint(attempt.store, record)) || !attempt.isActive()) {
        return;
    }
    const localMessage = attempt.store.getState().messages[record.message.id];
    if (!localMessage || localMessage.placeholder) {
        attempt.store.dispatch(addMessage(record.message));
    }
    if (record.checkpoint.phase !== 'completed') {
        attempt.store.dispatch(updateConversationStatus({ id: attempt.id, status: ConversationStatus.GENERATING }));
    }
}

async function recoverCheckpoint(attempt: RecoveryAttempt): Promise<void> {
    const { api, store, id, conversationId, userId, isActive, paused, saveCompletion, confirmToolRetry } = attempt;
    if (generationRegistry.isInProgress(id)) {
        return;
    }
    let controller: AbortController;
    try {
        controller = await generationRegistry.startExclusive(id);
    } catch (error) {
        if (error instanceof Error && error.message === OPERATION_IN_PROGRESS_MESSAGE) {
            if (id === conversationId) {
                await observeCheckpoint(attempt);
            }
            return;
        }
        throw error;
    }
    let resuming = false;
    try {
        const storage = generationRecoveryStore();
        const record = await storage.get<RecoveryRecord>(id);
        if (!record || !isActive()) {
            return;
        }
        if (record.conversation.ghost) {
            await storage.remove(id, record.checkpoint.jobId);
            void cancelGenerationJobs(api, record.checkpoint);
            return;
        }
        if (extraThunkArguments.dbApi && !generationRegistry.canRecover()) {
            return;
        }
        if (!(await restoreCheckpoint(store, record)) || !isActive()) {
            return;
        }
        if (record.checkpoint.phase === 'completed') {
            await saveCompletion(record);
            return;
        }
        if (id !== conversationId || paused.has(id)) {
            return;
        }
        resuming = true;
        void resumeCheckpoint(api, store, record, confirmToolRetry, controller, userId);
    } finally {
        if (!resuming) {
            generationRegistry.finish(id, controller);
        }
    }
}

export function useGenerationRecovery(conversationId: string | undefined, ready: boolean) {
    const api = useApi();
    const store = useLumoStore();
    const userId = useSafeUser()?.ID;
    const { resumableGeneration } = useLumoFlags();
    const masterKey = useLumoSelector(selectMasterKey);
    const recoveryReady = ready && resumableGeneration && (!extraThunkArguments.dbApi || Boolean(masterKey));
    const checking = useRef(false);
    const paused = useRef(new Set<string>());
    const queuedSaves = useRef(new Set<string>());
    const [hydrated, setHydrated] = useState(false);
    const [resumeAttempt, setResumeAttempt] = useState(0);
    const [pausedConversation, setPausedConversation] = useState<string>();
    const retryResolver = useRef<(approved: boolean) => void>(undefined);
    const [confirmRetry, setConfirmRetry] = useState<(approved: boolean) => void>();

    useEffect(() => {
        if (!recoveryReady) {
            return;
        }
        let active = true;
        const isActive = () => active;
        const restore = async () => {
            if (!active || document.visibilityState === 'hidden' || !navigator.onLine) {
                return;
            }
            const storage = generationRecoveryStore();
            if (conversationId && generationRegistry.isInProgress(conversationId)) {
                return;
            }
            if (checking.current) {
                return;
            }
            checking.current = true;
            try {
                for (const id of await storage.expiredIds()) {
                    finishExpiredGeneration(store, id);
                }
                for (const id of await storage.ids()) {
                    try {
                        await recoverCheckpoint({
                            api,
                            store,
                            id,
                            conversationId,
                            userId,
                            isActive,
                            paused: paused.current,
                            saveCompletion: async (record) => {
                                if (queuedSaves.current.has(record.checkpoint.jobId)) {
                                    return;
                                }
                                queuedSaves.current.add(record.checkpoint.jobId);
                                try {
                                    await saveRecoveredCompletion(api, store, record);
                                } catch (error) {
                                    queuedSaves.current.delete(record.checkpoint.jobId);
                                    throw error;
                                }
                            },
                            confirmToolRetry: () =>
                                new Promise<boolean>((resolve) => {
                                    const settle = (approved: boolean) => {
                                        retryResolver.current = undefined;
                                        setConfirmRetry(undefined);
                                        if (!approved) {
                                            paused.current.add(id);
                                            setPausedConversation(id);
                                        }
                                        resolve(approved);
                                    };
                                    retryResolver.current = settle;
                                    setConfirmRetry(() => settle);
                                }),
                        });
                    } catch (error) {
                        logGenerationRecoveryError('checkpoint restore', error);
                    }
                }
            } finally {
                checking.current = false;
                if (active) {
                    setHydrated(true);
                }
            }
        };
        const check = () => {
            void restore().catch((error) => logGenerationRecoveryError('checkpoint scan', error));
        };
        check();
        window.addEventListener('online', check);
        document.addEventListener('visibilitychange', check);
        const interval = setInterval(check, 5_000);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener('online', check);
            retryResolver.current?.(false);
            document.removeEventListener('visibilitychange', check);
        };
    }, [api, store, conversationId, recoveryReady, resumeAttempt, userId]);

    const modal = confirmRetry ? (
        <ModalTwo open onClose={() => confirmRetry(false)}>
            <ModalTwoHeader title={c('collider_2025:Title').t`Retry interrupted action?`} />
            <ModalTwoContent>{c('collider_2025:Info')
                .t`The app closed while an action was running. It may already have completed. Retrying could run it twice.`}</ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={() => confirmRetry(false)}>{c('Action').t`Keep paused`}</Button>
                <Button color="norm" onClick={() => confirmRetry(true)}>{c('Action').t`Retry action`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    ) : pausedConversation && pausedConversation === conversationId ? (
        <Button
            onClick={() => {
                if (conversationId) {
                    paused.current.delete(conversationId);
                    setPausedConversation(undefined);
                    setResumeAttempt((attempt) => attempt + 1);
                }
            }}
        >{c('Action').t`Review interrupted action`}</Button>
    ) : null;
    return { modal: resumableGeneration ? modal : null, hydrated: !resumableGeneration || hydrated };
}
