import type { ChatCompletionsFlatFunctionTool, ChatCompletionsFunctionTool } from '../types-api';
import type { ClientToolExecutor, ClientToolResult, PendingClientToolCall } from './client-tools';
import type { LumoApiClientConfig } from './types';

/** Result payload matching connector-bridge executeToolCall output. */
type NativeToolResultMessage = {
    role: 'tool';
    tool_call_id: string | null;
    name: string;
    content: string;
    is_error?: boolean;
};

type DesktopExternalTools = {
    ready?: Promise<void>;
    getTools?: () => ChatCompletionsFlatFunctionTool[] | ChatCompletionsFunctionTool[];
    getFlatApiTools?: () => ChatCompletionsFlatFunctionTool[];
    isNativeTool?: (name: string) => boolean;
    executeToolCall?: (toolCall: {
        id?: string;
        function?: { name?: string; arguments?: string };
        name?: string;
        arguments?: string;
    }) => Promise<NativeToolResultMessage>;
    executeToolCalls?: (
        toolCalls: {
            id?: string;
            function?: { name?: string; arguments?: string };
            name?: string;
            arguments?: string;
        }[]
    ) => Promise<NativeToolResultMessage[]>;
};

/** Connector manifest as returned by the desktop bridge (get_tool_registry). */
export type DesktopConnector = {
    id: string;
    display_name: string;
    icon?: string;
    enabled: boolean;
    connected: boolean;
    tools?: { name: string; title?: string; description?: string }[];
};

type LumoConnectorsApi = DesktopExternalTools & {
    getOpenAITools?: () => ChatCompletionsFunctionTool[];
    ensureOpenAIToolShape?: (
        tool: ChatCompletionsFunctionTool | ChatCompletionsFlatFunctionTool
    ) => ChatCompletionsFunctionTool;
    isAvailableTool?: (name: string) => boolean;
    getConnectors?: () => DesktopConnector[];
    getManifests?: () => DesktopConnector[];
    setConnectorEnabled?: (connectorId: string, enabled: boolean) => Promise<void>;
    respondToolApproval?: (requestId: string, approved: boolean) => Promise<void>;
    openSettings?: (tab?: DesktopSettingsTab) => Promise<void>;
};

export type DesktopSettingsTab = 'general' | 'connectors';

export type DesktopToolApprovalRequest = {
    requestId: string;
    connectorId: string;
    toolName: string;
    input: unknown;
};

/** Native's resolution of a request the webview may still be showing (timeout, policy change, …). */
export type DesktopToolApprovalResolved = {
    requestId: string;
    approved?: boolean;
};

export const TOOL_APPROVAL_REQUEST_EVENT = 'lumo:tool-approval-request';
export const TOOL_APPROVAL_RESOLVED_EVENT = 'lumo:tool-approval-resolved';

declare global {
    interface Window {
        __TAURI__?: {
            external_tools?: DesktopExternalTools;
        };
        LumoConnectors?: LumoConnectorsApi;
    }
    interface WindowEventMap {
        'lumo:tool-approval-request': CustomEvent<DesktopToolApprovalRequest>;
        'lumo:tool-approval-resolved': CustomEvent<DesktopToolApprovalResolved>;
    }
}

function getDesktopBridge(): DesktopExternalTools | null {
    return window.__TAURI__?.external_tools ?? window.LumoConnectors ?? null;
}

export function getDesktopConnectorsApi(): LumoConnectorsApi | null {
    return window.LumoConnectors ?? null;
}

export async function respondDesktopToolApproval(requestId: string, approved: boolean): Promise<void> {
    await getDesktopConnectorsApi()?.respondToolApproval?.(requestId, approved);
}

export async function openDesktopSettings(tab?: DesktopSettingsTab): Promise<void> {
    await getDesktopConnectorsApi()?.openSettings?.(tab);
}

export function isDesktopEnvironment(): boolean {
    return getDesktopBridge() !== null;
}

/** Opt in to the desktop tool bridge when running inside the Lumo Desktop shell. */
export function getDesktopLumoApiClientConfig(): Pick<LumoApiClientConfig, 'enableDesktopTools'> {
    return {
        enableDesktopTools: isDesktopEnvironment(),
    };
}

async function waitForDesktopTools(): Promise<void> {
    const bridge = getDesktopBridge();
    if (!bridge?.ready) {
        return;
    }
    await bridge.ready;
}

export async function getDesktopOpenAITools(): Promise<ChatCompletionsFunctionTool[]> {
    const bridge = getDesktopBridge();
    if (!bridge) {
        return [];
    }
    await waitForDesktopTools();
    return ((bridge as LumoConnectorsApi).getOpenAITools?.() ?? bridge.getTools?.() ?? []).map(
        (tool): ChatCompletionsFunctionTool => {
            if ('type' in tool && tool.type === 'function') {
                return tool;
            }
            const flatTool = tool as ChatCompletionsFlatFunctionTool;
            return {
                type: 'function',
                function: {
                    name: flatTool.name,
                    description: flatTool.description ?? '',
                    parameters: flatTool.parameters ?? { type: 'object', properties: {} },
                },
            };
        }
    );
}

export async function getDesktopConnectors(): Promise<DesktopConnector[]> {
    const api = window.LumoConnectors;
    if (!api) {
        return [];
    }
    if (api.ready) {
        await api.ready;
    }
    return api.getConnectors?.() ?? api.getManifests?.() ?? [];
}

export async function setDesktopConnectorEnabled(connectorId: string, enabled: boolean): Promise<void> {
    await window.LumoConnectors?.setConnectorEnabled?.(connectorId, enabled);
}

/** Subscribe to connector/tool changes emitted by the bridge. Returns an unsubscribe fn. */
export function subscribeDesktopConnectors(callback: () => void): () => void {
    window.addEventListener('lumo:tools-changed', callback);
    return () => window.removeEventListener('lumo:tools-changed', callback);
}

export function isDesktopNativeTool(name: string): boolean {
    const bridge = getDesktopBridge();
    if (!bridge) {
        return false;
    }
    const api = bridge as LumoConnectorsApi;
    return api.isNativeTool?.(name) ?? api.isAvailableTool?.(name) ?? false;
}

/** Map common model hallucinations to registered desktop tool names. */
const DESKTOP_TOOL_ALIASES: Record<string, string> = {
    browser_fetch: 'browser__fetch',
    browser_navigate: 'browser__navigate',
    filesystem_fs_read: 'filesystem__fs_read',
    filesystem_fs_search: 'filesystem__fs_search',
};

function normalizeDesktopToolName(name: string): string {
    return DESKTOP_TOOL_ALIASES[name] ?? name;
}

function normalizeDesktopToolCalls(calls: PendingClientToolCall[]): PendingClientToolCall[] {
    return calls.map((call) => ({
        ...call,
        name: normalizeDesktopToolName(call.name),
    }));
}

async function executeBridgeToolCalls(toolCalls: PendingClientToolCall[]): Promise<NativeToolResultMessage[]> {
    const bridge = getDesktopBridge();
    if (!bridge) {
        throw new Error('Desktop tools are not available');
    }
    await waitForDesktopTools();

    const openAiCalls = toolCalls.map((call) => ({
        id: call.id,
        function: {
            name: call.name,
            arguments: call.arguments,
        },
    }));

    if (bridge.executeToolCalls) {
        return bridge.executeToolCalls(openAiCalls);
    }

    if (bridge.executeToolCall) {
        return Promise.all(openAiCalls.map((call) => bridge.executeToolCall!(call)));
    }

    throw new Error('Desktop tool bridge does not support execution');
}

type ApprovalListener = () => void;

const APPROVAL_FALLBACK_TIMEOUT_MS = 130_000;

let pendingApprovals: readonly DesktopToolApprovalRequest[] = [];
const approvalListeners = new Set<ApprovalListener>();
const approvalTimers = new Map<string, ReturnType<typeof setTimeout>>();
let approvalListenerAttached = false;

function emitApprovals() {
    for (const listener of approvalListeners) {
        listener();
    }
}

function clearApprovalTimer(requestId: string) {
    const timer = approvalTimers.get(requestId);
    if (timer !== undefined) {
        clearTimeout(timer);
        approvalTimers.delete(requestId);
    }
}

/** Drop a pending card without answering native — used when native has already resolved the request. */
function removeToolApproval(requestId: string): void {
    clearApprovalTimer(requestId);
    const next = pendingApprovals.filter((entry) => entry.requestId !== requestId);
    if (next.length !== pendingApprovals.length) {
        pendingApprovals = next;
        emitApprovals();
    }
}

export function getPendingToolApprovals(): readonly DesktopToolApprovalRequest[] {
    return pendingApprovals;
}

export function subscribeToolApprovals(listener: ApprovalListener): () => void {
    approvalListeners.add(listener);
    return () => {
        approvalListeners.delete(listener);
    };
}

export function enqueueToolApproval(request: DesktopToolApprovalRequest): void {
    if (pendingApprovals.some((entry) => entry.requestId === request.requestId)) {
        return;
    }
    pendingApprovals = [...pendingApprovals, request];
    if (typeof setTimeout !== 'undefined') {
        approvalTimers.set(
            request.requestId,
            setTimeout(() => removeToolApproval(request.requestId), APPROVAL_FALLBACK_TIMEOUT_MS)
        );
    }
    emitApprovals();
}

export function resolveToolApproval(requestId: string, approved: boolean): void {
    clearApprovalTimer(requestId);
    const next = pendingApprovals.filter((entry) => entry.requestId !== requestId);
    if (next.length !== pendingApprovals.length) {
        pendingApprovals = next;
        emitApprovals();
    }
    void respondDesktopToolApproval(requestId, approved).catch((error) => {
        console.warn('failed to record tool approval decision; the core will time out', error);
    });
}

function handleApprovalRequest(event: WindowEventMap['lumo:tool-approval-request']) {
    const detail = event.detail;
    if (detail?.requestId) {
        enqueueToolApproval(detail);
    }
}

// Native resolved a request the webview may still be showing (timeout, policy change, connector
// disabled, …). Drop the card without answering back — native has already moved on.
function handleApprovalResolved(event: WindowEventMap['lumo:tool-approval-resolved']) {
    const detail = event.detail;
    if (detail?.requestId) {
        removeToolApproval(detail.requestId);
    }
}

export function initDesktopToolApprovals(): void {
    if (approvalListenerAttached || typeof window === 'undefined' || !isDesktopEnvironment()) {
        return;
    }
    approvalListenerAttached = true;
    window.addEventListener(TOOL_APPROVAL_REQUEST_EVENT, handleApprovalRequest);
    window.addEventListener(TOOL_APPROVAL_RESOLVED_EVENT, handleApprovalResolved);
}

export function createDesktopClientToolExecutor(): ClientToolExecutor {
    initDesktopToolApprovals();

    return {
        getClientTools: getDesktopOpenAITools,
        canExecute: isDesktopNativeTool,
        normalizeCalls: normalizeDesktopToolCalls,
        execute: async (calls) => {
            const results = await executeBridgeToolCalls(calls);
            return results.map((result): ClientToolResult => ({
                content: result.content,
                is_error: result.is_error,
            }));
        },
    };
}
