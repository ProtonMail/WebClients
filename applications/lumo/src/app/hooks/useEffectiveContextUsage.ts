import { useEffect, useMemo, useRef, useState } from 'react';

import isEqual from 'lodash/isEqual';

import { useApi } from '@proton/app-context/useApi';
import { isDesktopEnvironment, subscribeDesktopConnectors } from '@proton/lumo-api-client/core/desktop-tools';
import shallowEqual from '@proton/utils/shallowEqual';

import { buildArtifactRegistry } from '../components/Conversation/artifact/artifactRegistry';
import { resolveClientToolDefinitions, resolveClientToolExecutor } from '../components/Conversation/compactionFlow';
import { resolveConversationRequest } from '../components/Conversation/helper';
import { prepareRequest } from '../llm';
import { fillAttachmentData } from '../llm/attachments';
import type { ContextFilter } from '../llm/contextFilter';
import type { RequestBudget } from '../llm/requestBudget';
import type { EffectiveContextUsage } from '../llm/requestContextUsage';
import { useIsGuest } from '../providers/IsGuestProvider';
import { useLumoDispatch, useLumoMemoSelector, useLumoSelector } from '../redux/hooks';
import { selectContextFilters, selectMessagesByConversationId } from '../redux/selectors';
import type { LumoDispatch } from '../redux/store';
import { type Attachment, type Message, Role, SpaceType, getSpaceDek } from '../types';
import { useRequestBudget } from './useContextLimits';
import { useLumoFlags } from './useLumoFlags';
import { useLumoPlan } from './useLumoPlan';

const EMPTY_ATTACHMENTS: Attachment[] = [];

type ResolvedRequest = Awaited<ReturnType<ReturnType<typeof resolveConversationRequest>>>;
type RequestDefinitions = Pick<ResolvedRequest, 'options'> & {
    attachments: Attachment[];
    clientTools: Awaited<ReturnType<typeof resolveClientToolDefinitions>>;
};
type DefinitionSnapshot = RequestDefinitions & { inputs: object; scope: string };
type DefinitionLoad = {
    inputs: object;
    controller: AbortController;
    promise: Promise<RequestDefinitions>;
    consumers: number;
};

const definitionLoads = new WeakMap<LumoDispatch, Set<DefinitionLoad>>();

function acquireRequestDefinitions(
    dispatch: LumoDispatch,
    inputs: object,
    resolve: (signal: AbortSignal) => Promise<RequestDefinitions>
) {
    let loads = definitionLoads.get(dispatch);
    if (!loads) {
        loads = new Set();
        definitionLoads.set(dispatch, loads);
    }
    let load = [...loads].find((candidate) => isEqual(candidate.inputs, inputs));
    if (!load) {
        const controller = new AbortController();
        load = { inputs, controller, promise: resolve(controller.signal), consumers: 0 };
        loads.add(load);
    }
    const activeLoad = load;
    const activeLoads = loads;
    activeLoad.consumers += 1;
    return {
        promise: activeLoad.promise,
        release: () => {
            activeLoad.consumers -= 1;
            if (activeLoad.consumers === 0) {
                activeLoad.controller.abort();
                activeLoads.delete(activeLoad);
            }
        },
    };
}

function toCalibratedUsage(usage: EffectiveContextUsage, budget: RequestBudget): EffectiveContextUsage {
    const scale = (tokens: number) => tokens * budget.calibration;
    const conversationTokens = scale(usage.conversationTokens);
    const toolCallTokens = scale(usage.toolCallTokens);
    const instructionTokens = scale(usage.instructionTokens);
    const fileTokens = scale(usage.fileTokens);
    return {
        ...usage,
        conversationTokens,
        toolCallTokens,
        instructionTokens,
        fileTokens,
        usedTokens: scale(usage.usedTokens),
    };
}

export function useEffectiveContextUsage(
    messageChain: Message[],
    currentAttachments = EMPTY_ATTACHMENTS,
    spaceIdOverride?: string
) {
    const contextFilters = useLumoSelector(selectContextFilters);
    return useEffectiveContextUsageWithFilters(messageChain, contextFilters, currentAttachments, spaceIdOverride);
}

export function useEffectiveContextUsageWithFilters(
    messageChain: Message[],
    contextFilters: ContextFilter[],
    currentAttachmentsInput = EMPTY_ATTACHMENTS,
    spaceIdOverride?: string
) {
    const currentAttachments = currentAttachmentsInput.length === 0 ? EMPTY_ATTACHMENTS : currentAttachmentsInput;
    const api = useApi();
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const { hasLumoPlus } = useLumoPlan();
    const flags = useLumoFlags();
    const conversationId = messageChain[0]?.conversationId;
    const conversation = useLumoSelector((state) => {
        const chat = conversationId ? state.conversations[conversationId] : undefined;
        return (
            chat && {
                spaceId: chat.spaceId,
                agentId: chat.agentId,
                artifactCreation: chat.artifactCreation,
                ghost: chat.ghost,
            }
        );
    }, isEqual);
    const spaceId = spaceIdOverride ?? conversation?.spaceId ?? currentAttachments[0]?.spaceId ?? '';
    const space = useLumoSelector((state) => {
        const selected = state.spaces[spaceId];
        return (
            selected && {
                spaceKey: selected.spaceKey,
                spaceType: selected.spaceType,
                projectInstructions:
                    selected.spaceType === SpaceType.Project ? selected.projectInstructions : undefined,
                chatSearch: selected.spaceType === SpaceType.Project ? selected.chatSearch : undefined,
                searchOtherProjects:
                    selected.spaceType === SpaceType.Project ? selected.searchOtherProjects : undefined,
                skillIdsOrSubSkillRefs:
                    selected.spaceType === SpaceType.Schedule ? selected.schedule.skillIdsOrSubSkillRefs : undefined,
            }
        );
    }, isEqual);
    const userSettings = useLumoSelector((state) => {
        const settings = state.lumoUserSettings;
        return {
            customAgents: settings.customAgents,
            automaticArtifactCreation: settings.automaticArtifactCreation,
            isMemoryEnabled: settings.isMemoryEnabled,
            memories: settings.memories,
            isVisualizationInstructionsEnabled: settings.isVisualizationInstructionsEnabled,
            conversationSearch: settings.conversationSearch,
            isCrossProjectSearchEnabled: settings.isCrossProjectSearchEnabled,
        };
    }, isEqual);
    const personalization = useLumoSelector((state) => state.personalization);
    const skills = useLumoSelector((state) => state.skills.skills);
    const pendingAgent = useLumoSelector((state) => state.composerActions.pendingAgentId);
    const pendingArtifactCreation = useLumoSelector((state) => state.composerActions.pendingArtifactCreation);
    const messageMap = useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
    const budget = useRequestBudget(conversationId);
    const user = useLumoSelector((state) => state.user?.value);
    const attachmentIds = JSON.stringify(messageChain.flatMap((message) => message.attachments ?? []));
    const attachmentRefs = useMemo(() => JSON.parse(attachmentIds) as Attachment[], [attachmentIds]);
    const attachments = useLumoSelector((state) => {
        const unique = new Map(
            [...attachmentRefs, ...currentAttachments].map((file) => [file.id, state.attachments[file.id] ?? file])
        );
        return [...unique.values()];
    }, shallowEqual);
    const [definitions, setDefinitions] = useState<DefinitionSnapshot>();
    const [failedInputs, setFailedInputs] = useState<object>();
    const [connectorRevision, setConnectorRevision] = useState(0);
    useEffect(() => subscribeDesktopConnectors(() => setConnectorRevision((revision) => revision + 1)), []);

    // Streamed assistant text changes the estimate, but doesn't require reloading instructions or schemas.
    const userMessages = JSON.stringify(messageChain.filter((message) => message.role === Role.User));
    const hasArtifacts = Object.keys(buildArtifactRegistry(messageChain)).length > 0;
    const compaction = JSON.stringify(
        messageChain.flatMap((message) => (message.compaction ? [message.compaction] : []))
    );
    const settings = useMemo(
        () => ({
            personalization,
            isArtifactsViewFeatureEnabled: flags.artifactsView,
            isArtifactSlidesFeatureEnabled: flags.artifactSlides,
            isVisualizationInstructionsFeatureEnabled: flags.visualizationInstructions,
            isSkillsFeatureEnabled: flags.skills,
            isGuestUser: isGuest,
            hasLumoPlus,
        }),
        [
            personalization,
            flags.artifactsView,
            flags.artifactSlides,
            flags.visualizationInstructions,
            flags.skills,
            isGuest,
            hasLumoPlus,
        ]
    );
    const ui = useMemo(
        () => ({
            enableRetrievalTools: flags.retrievalTools,
            enableAskUserQuestionsTool: flags.askUserQuestionsTool,
            enableCreateScheduleTool: flags.schedules && flags.createScheduleTool && isDesktopEnvironment(),
        }),
        [flags.retrievalTools, flags.askUserQuestionsTool, flags.schedules, flags.createScheduleTool]
    );

    const requestContextRef = useRef({ messageChain, messageMap });
    requestContextRef.current = { messageChain, messageMap };
    const scope = JSON.stringify([conversationId, spaceId, user?.ID]);
    const definitionInputs = useMemo(
        () => ({
            conversationId,
            spaceId,
            space,
            conversation,
            userSettings,
            skills,
            pendingAgent,
            pendingArtifactCreation,
            attachments,
            contextFilters,
            settings,
            ui,
            userMessages,
            hasArtifacts,
            compaction,
            connectorRevision,
            user,
        }),
        [
            conversationId,
            spaceId,
            space,
            conversation,
            userSettings,
            skills,
            pendingAgent,
            pendingArtifactCreation,
            attachments,
            contextFilters,
            settings,
            ui,
            userMessages,
            hasArtifacts,
            compaction,
            connectorRevision,
            user,
        ]
    );

    useEffect(() => {
        let active = true;
        const context = requestContextRef.current;
        const load = acquireRequestDefinitions(dispatch, { api, ...definitionInputs }, async (signal) => {
            const { conversationId, spaceId, space, attachments, contextFilters, settings, ui, user } =
                definitionInputs;
            const spaceDek = space ? await getSpaceDek(space) : undefined;
            const filledAttachments = await fillAttachmentData(attachments, {}, user, spaceDek, spaceId);
            const request = await dispatch(
                resolveConversationRequest({
                    conversationContext: {
                        conversationId: conversationId ?? '',
                        spaceId,
                        ...context,
                        allConversationAttachments: filledAttachments,
                        contextFilters,
                    },
                    settingsContext: settings,
                    uiContext: ui,
                    applicationContext: { api, signal },
                })
            );
            const { executor } = resolveClientToolExecutor(
                request.toolOptions,
                dispatch,
                () => [],
                undefined,
                conversationId
            );
            const clientTools = await resolveClientToolDefinitions(executor);
            return { options: request.options, attachments: filledAttachments, clientTools };
        });
        void load.promise.then(
            (resolved) => {
                if (active) {
                    setDefinitions({ ...resolved, inputs: definitionInputs, scope });
                    setFailedInputs(undefined);
                }
            },
            () => {
                if (active) {
                    setFailedInputs(definitionInputs);
                }
            }
        );
        return () => {
            active = false;
            load.release();
        };
    }, [api, dispatch, definitionInputs, scope]);

    return useMemo(() => {
        const currentDefinitions = definitions?.scope === scope ? definitions : undefined;
        const filled = new Map(currentDefinitions?.attachments.map((file) => [file.id, file]));
        const request = prepareRequest({
            ...currentDefinitions?.options,
            messageChain,
            contextFilters,
            attachments: currentDefinitions?.attachments ?? attachments,
            currentAttachments: currentAttachments.map((file) => filled.get(file.id) ?? file),
            messageMap,
            budget,
            clientTools: currentDefinitions?.clientTools,
        });
        const hasError = failedInputs === definitionInputs;
        return {
            ...toCalibratedUsage(request.usage, budget),
            isPending: currentDefinitions === undefined && !hasError,
            isUnavailable: currentDefinitions === undefined && hasError,
            isStale: currentDefinitions !== undefined && currentDefinitions.inputs !== definitionInputs,
        };
    }, [
        definitions,
        failedInputs,
        scope,
        definitionInputs,
        messageChain,
        contextFilters,
        attachments,
        currentAttachments,
        messageMap,
        budget,
    ]);
}
