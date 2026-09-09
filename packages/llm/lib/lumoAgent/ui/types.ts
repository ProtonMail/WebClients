import type { ComponentType, ReactNode } from 'react';

import type { ToolName as ServerToolName } from '@proton/lumo-api-client';
import type { ServerToolSource } from '@proton/lumo-ui';
import type { IconComponent } from '@proton/lumo-ui/types';

import type { ActionRequest, ReferenceLabels, ToolDefinition, ToolHandlers, ToolName } from '../contracts/types';

/** `APPLYING` exists so the tile can record the outcome rather than the click that started it. */
export enum ConfirmStatus {
    PENDING = 'pending',
    APPLYING = 'applying',
    APPLIED = 'applied',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

/**
 * A chain parked on the round budget, and what it managed before it stopped — so the offer to carry on
 * can say how far it has got rather than "this is taking a lot of steps".
 */
export interface ToolLimit {
    /** Tool calls made this exchange, the resumed rounds included. */
    steps: number;
    /** The last step the user was shown; absent when that step was a mutation, which reports as a tile. */
    activity?: string;
}

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
          labels: ReferenceLabels;
          status: ConfirmStatus;
      }
    | { id: number; kind: 'error'; message: string };

/** Props a bespoke confirm-card body receives; it edits `params` and reports changes via `onChange`. */
export interface CardBodyProps {
    action: ActionRequest;
    labels: ReferenceLabels;
    params: Record<string, any>;
    onChange: (params: Record<string, any>) => void;
}

/**
 * How one tool's confirm card + settled result tile render. A product registers one per mutation; a
 * renderer may mount a shared body from `@proton/lumo-ui` or a bespoke one. Reads need no renderer.
 */
export interface CardRenderer {
    icon: IconComponent;
    /**
     * What is about to happen, as one line: "Move 3 emails to Travel". The `action` this is handed
     * carries the params the user is looking at *now*, not the ones the model proposed, so a sentence
     * that counts a selection counts what Confirm would apply.
     */
    sentence: (action: ActionRequest, labels: ReferenceLabels) => ReactNode;
    /** Optional editable body; omit for a plain confirm (sentence + apply/cancel only). */
    renderBody?: (props: CardBodyProps) => ReactNode;
    /** Whether the body's current `params` are applyable; false disables Confirm (e.g. nothing selected). */
    canApply?: (params: Record<string, any>) => boolean;
    /** Optional one-line detail shown on the settled result tile. */
    detail?: (action: ActionRequest, labels: ReferenceLabels) => string | undefined;
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
    /** A callback so rules can follow what is on screen. Called once per message sent. */
    productRules?: () => string;
    serverTools?: ServerToolName[];
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
}
