import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { ToolCallData } from '../../../../../../lib/toolCall/types';

type ThinkingStep =
    | { type: 'reasoning'; content: string; isActive: boolean; durationMs?: number }
    | { type: 'tool_call'; toolCall: ToolCallData; result?: string; isActive: boolean };

type ThinkingPhase =
    | 'reasoning'
    | 'web_search'
    | 'weather'
    | 'finance'
    | 'describe_image'
    | 'generate_image'
    | 'edit_image'
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
            return 'describe_image';
        case 'generate_image':
            return 'generate_image';
        case 'edit_image':
            return 'edit_image';
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

    if (steps.some((step) => step.type === 'reasoning')) {
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

    if (phases.length === 0 && steps.length > 0) {
        phases.push('reasoning');
    }

    return phases;
}

const PHASE_ACTIVE: Record<ThinkingPhase, readonly (() => string)[]> = {
    reasoning: [
        () => c('collider_2025:Reasoning').t`Thinking`,
        () => c('collider_2025:Reasoning').t`Working through this`,
    ],
    web_search: [
        () => c('collider_2025:Reasoning').t`Searching the web`,
        () => c('collider_2025:Reasoning').t`Looking things up online`,
    ],
    weather: [
        () => c('collider_2025:Reasoning').t`Checking the weather`,
        () => c('collider_2025:Reasoning').t`Looking up the forecast`,
    ],
    finance: [
        () => c('collider_2025:Reasoning').t`Looking up market data`,
        () => c('collider_2025:Reasoning').t`Checking prices`,
    ],
    describe_image: [
        () => c('collider_2025:Reasoning').t`Looking at your image`,
        () => c('collider_2025:Reasoning').t`Working on an image`,
    ],
    generate_image: [
        () => c('collider_2025:Reasoning').t`Generating image`,
        () => c('collider_2025:Reasoning').t`Creating an image`,
    ],
    edit_image: [
        () => c('collider_2025:Reasoning').t`Editing image`,
        () => c('collider_2025:Reasoning').t`Updating your image`,
    ],
    proton_info: [() => c('collider_2025:Reasoning').t`Checking ${BRAND_NAME} knowledge`],
    web_extract: [
        () => c('collider_2025:Reasoning').t`Reading a web page`,
        () => c('collider_2025:Reasoning').t`Extracting page content`,
    ],
    other: [() => c('collider_2025:Reasoning').t`Using a tool`],
};

const PHASE_COMPLETE: Record<ThinkingPhase, readonly (() => string)[]> = {
    reasoning: [
        () => c('collider_2025:Reasoning').t`Thought this through`,
        () => c('collider_2025:Reasoning').t`Worked through your question`,
    ],
    web_search: [
        () => c('collider_2025:Reasoning').t`Searched the web`,
        () => c('collider_2025:Reasoning').t`Looked things up online`,
    ],
    weather: [
        () => c('collider_2025:Reasoning').t`Checked the weather`,
        () => c('collider_2025:Reasoning').t`Looked up the forecast`,
    ],
    finance: [
        () => c('collider_2025:Reasoning').t`Looked up market data`,
        () => c('collider_2025:Reasoning').t`Checked prices`,
    ],
    describe_image: [
        () => c('collider_2025:Reasoning').t`Looked at your image`,
        () => c('collider_2025:Reasoning').t`Worked on an image`,
    ],
    generate_image: [
        () => c('collider_2025:Reasoning').t`Generated image`,
        () => c('collider_2025:Reasoning').t`Created an image`,
    ],
    edit_image: [
        () => c('collider_2025:Reasoning').t`Edited image`,
        () => c('collider_2025:Reasoning').t`Updated your image`,
    ],
    proton_info: [() => c('collider_2025:Reasoning').t`Checked ${BRAND_NAME} knowledge`],
    web_extract: [
        () => c('collider_2025:Reasoning').t`Read a web page`,
        () => c('collider_2025:Reasoning').t`Extracted page content`,
    ],
    other: [() => c('collider_2025:Reasoning').t`Used a tool`],
};

function getPhaseLabel(phase: ThinkingPhase, seed: string, active: boolean): string {
    const options = active ? PHASE_ACTIVE[phase] : PHASE_COMPLETE[phase];
    return pickStable(options, `${seed}:${phase}:${active ? 'active' : 'complete'}`)();
}

function lowercaseLeadingAction(action: string): string {
    if (!action) return action;
    return action.charAt(0).toLowerCase() + action.slice(1);
}

function joinActions(actions: string[]): string {
    if (actions.length === 0) return '';
    if (actions.length === 1) return actions[0];

    const firstAction = actions[0];
    const secondAction = lowercaseLeadingAction(actions[1]);
    if (actions.length === 2) {
        return `${firstAction} and ${secondAction}`;
    }

    const middleActions = actions.slice(1, -1).map(lowercaseLeadingAction).join(', ');
    const lastAction = lowercaseLeadingAction(actions[actions.length - 1]);
    const leadingActions = middleActions ? `${firstAction}, ${middleActions}` : firstAction;
    return `${leadingActions} and ${lastAction}`;
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
    const actions = active ? buildActiveActions(steps, seed) : buildCompleteActions(steps, seed);
    const joined = joinActions(actions);

    if (!joined.trim()) {
        return active
            ? c('collider_2025:Reasoning').t`Thinking...`
            : c('collider_2025:Reasoning').t`Thought this through`;
    }

    return active ? `${joined}...` : joined;
}
