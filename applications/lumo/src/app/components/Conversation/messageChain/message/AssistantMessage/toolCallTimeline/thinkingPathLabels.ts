import { c } from 'ttag';

import type { ToolCallData } from '../../../../../../lib/toolCall/types';
import {BRAND_NAME} from "@proton/shared/lib/constants";

type ThinkingStep =
    | { type: 'reasoning'; content: string; isActive: boolean; durationMs?: number }
    | { type: 'tool_call'; toolCall: ToolCallData; result?: string; isActive: boolean };

type ThinkingPhase =
    | 'reasoning'
    | 'web_search'
    | 'weather'
    | 'finance'
    | 'image'
    | 'proton_info'
    | 'web_extract'
    | 'other';

function hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function pickStable<T>(items: readonly T[], seed: string): T {
    return items[hashString(seed) % items.length];
}

function toolCallToPhase(toolCall: ToolCallData): ThinkingPhase {
    switch (toolCall.name) {
        case 'web_search':
            return 'web_search';
        case 'weather':
            return 'weather';
        case 'stock':
        case 'cryptocurrency':
            return 'finance';
        case 'describe_image':
        case 'generate_image':
        case 'edit_image':
            return 'image';
        case 'proton_info':
            return 'proton_info';
        case 'web_extract':
            return 'web_extract';
        default:
            return 'other';
    }
}

function getPhases(steps: ThinkingStep[]): ThinkingPhase[] {
    const phases: ThinkingPhase[] = [];

    if (steps.some((step) => step.type === 'reasoning' && step.content.trim())) {
        phases.push('reasoning');
    }

    const seen = new Set<ThinkingPhase>();
    for (const step of steps) {
        if (step.type !== 'tool_call') continue;

        const phase = toolCallToPhase(step.toolCall);
        if (seen.has(phase)) continue;

        seen.add(phase);
        phases.push(phase);
    }

    return phases;
}

const PRIVACY_PREFIXES = [
    () => c('collider_2025:Reasoning').t`Just between us`,
    () => c('collider_2025:Reasoning').t`Privately`,
    () => c('collider_2025:Reasoning').t`Keeping this hush-hush`,
    () => c('collider_2025:Reasoning').t`In your private lane`,
] as const;

const PHASE_ACTIVE: Record<ThinkingPhase, readonly (() => string)[]> = {
    reasoning: [
        () => c('collider_2025:Reasoning').t`ruminating`,
        () => c('collider_2025:Reasoning').t`purring over this`,
        () => c('collider_2025:Reasoning').t`pawing through this`,
        () => c('collider_2025:Reasoning').t`whisker-twitching`,
    ],
    web_search: [
        () => c('collider_2025:Reasoning').t`prowling the web`,
        () => c('collider_2025:Reasoning').t`sniffing around online`,
        () => c('collider_2025:Reasoning').t`hunting down answers`,
    ],
    weather: [
        () => c('collider_2025:Reasoning').t`checking the forecast`,
        () => c('collider_2025:Reasoning').t`sniffing out the weather`,
    ],
    finance: [
        () => c('collider_2025:Reasoning').t`stalking the markets`,
        () => c('collider_2025:Reasoning').t`tracking the tickers`,
    ],
    image: [
        () => c('collider_2025:Reasoning').t`sketching something`,
        () => c('collider_2025:Reasoning').t`conjuring an image`,
        () => c('collider_2025:Reasoning').t`grooming a picture`,
    ],
    proton_info: [() => c('collider_2025:Reasoning').t`consulting ${BRAND_NAME} knowledge`],
    web_extract: [
        () => c('collider_2025:Reasoning').t`digging into a page`,
        () => c('collider_2025:Reasoning').t`extracting page content`,
    ],
    other: [() => c('collider_2025:Reasoning').t`using a tool`],
};

const PHASE_COMPLETE: Record<ThinkingPhase, readonly (() => string)[]> = {
    reasoning: [
        () => c('collider_2025:Reasoning').t`ruminated`,
        () => c('collider_2025:Reasoning').t`purred over this`,
        () => c('collider_2025:Reasoning').t`pawed through this`,
        () => c('collider_2025:Reasoning').t`had a quiet think`,
    ],
    web_search: [
        () => c('collider_2025:Reasoning').t`prowled the web`,
        () => c('collider_2025:Reasoning').t`sniffed around online`,
        () => c('collider_2025:Reasoning').t`hunted down answers`,
    ],
    weather: [
        () => c('collider_2025:Reasoning').t`checked the forecast`,
        () => c('collider_2025:Reasoning').t`sniffed out the weather`,
    ],
    finance: [
        () => c('collider_2025:Reasoning').t`stalked the markets`,
        () => c('collider_2025:Reasoning').t`tracked the tickers`,
    ],
    image: [
        () => c('collider_2025:Reasoning').t`sketched something`,
        () => c('collider_2025:Reasoning').t`conjured an image`,
        () => c('collider_2025:Reasoning').t`groomed a picture`,
    ],
    proton_info: [() => c('collider_2025:Reasoning').t`consulted ${BRAND_NAME} knowledge`],
    web_extract: [
        () => c('collider_2025:Reasoning').t`dug into a page`,
        () => c('collider_2025:Reasoning').t`extracted page content`,
    ],
    other: [() => c('collider_2025:Reasoning').t`used a tool`],
};

function getPhaseLabel(phase: ThinkingPhase, seed: string, active: boolean): string {
    const options = active ? PHASE_ACTIVE[phase] : PHASE_COMPLETE[phase];
    return pickStable(options, `${seed}:${phase}:${active ? 'active' : 'complete'}`)();
}

function joinActions(actions: string[]): string {
    if (actions.length === 0) return '';
    if (actions.length === 1) return actions[0];
    if (actions.length === 2) {
        return c('collider_2025:Reasoning').t`${actions[0]} and ${actions[1]}`;
    }
    return c('collider_2025:Reasoning')
        .t`${actions.slice(0, -1).join(', ')} and ${actions[actions.length - 1]}`;
}

function buildCompleteActions(steps: ThinkingStep[], seed: string): string[] {
    return getPhases(steps).map((phase) => getPhaseLabel(phase, seed, false));
}

function buildActiveActions(steps: ThinkingStep[], seed: string): string[] {
    const actions: string[] = [];

    if (steps.some((step) => step.type === 'reasoning' && step.isActive)) {
        actions.push(getPhaseLabel('reasoning', seed, true));
    }

    const activeToolStep = steps.find(
        (step): step is Extract<ThinkingStep, { type: 'tool_call' }> =>
            step.type === 'tool_call' && step.isActive
    );

    if (activeToolStep) {
        actions.push(getPhaseLabel(toolCallToPhase(activeToolStep.toolCall), seed, true));
    }

    if (actions.length === 0) {
        actions.push(getPhaseLabel('reasoning', seed, true));
    }

    return actions;
}

export function getThinkingPathHeader(steps: ThinkingStep[], messageId: string, active: boolean): string {
    const seed = `${messageId}:thinking-header`;
    const privacy = pickStable(PRIVACY_PREFIXES, seed)();
    const actions = active ? buildActiveActions(steps, seed) : buildCompleteActions(steps, seed);
    const joined = joinActions(actions);

    return active
        ? c('collider_2025:Reasoning').t`${privacy} — ${joined}...`
        : c('collider_2025:Reasoning').t`${privacy} — ${joined}`;
}
