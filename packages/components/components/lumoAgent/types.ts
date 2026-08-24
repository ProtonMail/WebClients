import type { ComponentType, ReactNode } from 'react';

import type { ActionRequest, ToolDefinition, ToolHandlers, ToolName } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { ToolName as ServerToolName } from '@proton/lumo-api-client';
import type { ServerToolSource } from '@proton/lumo-ui';
import type { IconComponent } from '@proton/lumo-ui/types';

/** The chat items the panel renders — the human-facing view of the executor's event stream. */
export type LumoAgentItem =
    | { id: number; kind: 'user'; text: string }
    | { id: number; kind: 'reply'; text: string }
    | { id: number; kind: 'chip'; tool: ToolName; label: string; payload: string }
    | { id: number; kind: 'servertool'; tool: ServerToolName; sources: ServerToolSource[] }
    | {
          id: number;
          kind: 'confirm';
          action: ActionRequest;
          labels: Record<string, string>;
          status: 'pending' | 'applied' | 'cancelled';
      }
    | { id: number; kind: 'error'; message: string };

/** Props a bespoke confirm-card body receives; it edits `params` and reports changes via `onChange`. */
export interface CardBodyProps {
    action: ActionRequest;
    labels: Record<string, string>;
    params: Record<string, any>;
    onChange: (params: Record<string, any>) => void;
}

/**
 * How one tool's confirm card + settled result tile render. A product registers one per mutation; a
 * renderer may mount a shared body from `@proton/lumo-ui` or a bespoke one. Reads need no renderer.
 */
export interface CardRenderer {
    icon: IconComponent;
    title: (action: ActionRequest, labels: Record<string, string>) => string;
    subtitle?: (action: ActionRequest, labels: Record<string, string>) => string | undefined;
    /** Optional editable body; omit for a plain confirm (title + apply/cancel only). */
    renderBody?: (props: CardBodyProps) => ReactNode;
    /** Whether the body's current `params` are applyable; false disables Confirm (e.g. nothing selected). */
    canApply?: (params: Record<string, any>) => boolean;
    /** Optional one-line detail shown on the settled result tile. */
    detail?: (action: ActionRequest, labels: Record<string, string>) => string | undefined;
}

export type CardRenderers = Partial<Record<ToolName, CardRenderer>>;

/** Label + icon for a server tool's chip, supplied by the product (the framework stays word-blind). */
export interface ServerToolMeta {
    /** Called at render, not at config time, so the wording follows an in-session language change. */
    label: () => string;
    icon: ComponentType<{ className?: string }>;
}

/** Everything a product supplies to stand up its assistant — no framework edit needed to add a product. */
export interface LumoAgentConfig {
    definitions: ToolDefinition[];
    handlers: ToolHandlers;
    cardRenderers?: CardRenderers;
    productRules?: string;
    serverTools?: ServerToolName[];
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
}
