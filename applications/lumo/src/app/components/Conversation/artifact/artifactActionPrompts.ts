import { c } from 'ttag';

import type { ArtifactActionMeta, DeckSelectionPart } from '../../../types';

/**
 * Where each selected piece is in the deck JSON, e.g. `- slide 3, bullet 2: "…"`. Field names are the
 * deck format's, so this stays in English whatever the app language.
 */
const deckFieldName = (part: DeckSelectionPart): string => {
    if (part.field === 'bullet' && part.bullet !== undefined) {
        return `bullet ${part.bullet}`;
    }
    if ((part.field === 'left' || part.field === 'right') && part.bullet !== undefined) {
        return `${part.field} column, bullet ${part.bullet}`;
    }
    if (part.field === 'missingData') {
        return 'chart marked as missing, with "missing"';
    }
    return part.field;
};

const describeDeckSelection = (parts: DeckSelectionPart[]): string => {
    return parts
        .map((part) => {
            const field = deckFieldName(part);
            const selected = part.selected === part.text ? '' : ` (selected: ${JSON.stringify(part.selected)})`;
            return `- slide ${part.slide}, ${field}: ${JSON.stringify(part.text)}${selected}`;
        })
        .join('\n');
};

export function buildArtifactActionLlmPrompt(meta: ArtifactActionMeta): string {
    const { kind, artifactId, artifactTitle, selection, userInstruction, deckSelection } = meta;

    if (kind === 'explain') {
        // translator: sent to the AI, never shown to the user. Translate "artifact" literally; do not use the user-facing word "creation".
        return c('collider_2025:Prefill')
            .t`Explain this selected part of the "${artifactTitle}" code artifact (id: ${artifactId}):\n\n"${selection}"`;
    }

    if (kind === 'improve') {
        // translator: sent to the AI, never shown to the user. Translate "artifact" literally; do not use the user-facing word "creation".
        return c('collider_2025:Prefill')
            .t`Improve this selected part of the "${artifactTitle}" code artifact (id: ${artifactId}). Update the artifact, replacing:\n\n"${selection}"\n\nwith improved code.`;
    }

    const instruction = userInstruction ?? '';

    if (deckSelection) {
        const locations = describeDeckSelection(deckSelection);
        // translator: sent to the AI, never shown to the user. Translate "artifact" literally; do not use the user-facing word "creation". Keep "calculated" and "gaps" in English: they are field names.
        const prompt = c('collider_2025:Prefill')
            .t`Edit the "${artifactTitle}" slide deck artifact (id: ${artifactId}). The user selected:\n\n${locations}\n\nChange: ${instruction}\n\nUpdate the artifact with the whole deck JSON. Change only what this asks for and keep every other slide as it is. The deck rules still apply: never invent numbers, list calculated numbers in "calculated", and report missing data in "gaps".`;
        const fillsMissingData = deckSelection.some((part) => {
            return part.field === 'missingData';
        });
        if (!fillsMissingData) {
            return prompt;
        }
        // translator: sent to the AI, never shown to the user. Keep "missing", "source" and "gaps" in English: they are field names.
        const missingDataRule = c('collider_2025:Prefill')
            .t`If the change gives the missing data, replace "missing" with the chart's data, say in "source" that the user provided it, and remove the matching entry from "gaps".`;
        return `${prompt} ${missingDataRule}`;
    }

    // translator: sent to the AI, never shown to the user. Translate "artifact" literally; do not use the user-facing word "creation".
    return c('collider_2025:Prefill')
        .t`Edit the "${artifactTitle}" artifact (id: ${artifactId}). Replace this part:\n\n"${selection}"\n\nwith: ${instruction}`;
}

export function getArtifactActionLabel(kind: ArtifactActionMeta['kind']): string {
    if (kind === 'explain') {
        return c('collider_2025:Action').t`Explain`;
    }
    if (kind === 'improve') {
        return c('collider_2025:Action').t`Improve`;
    }
    return c('collider_2025:Action').t`Edit`;
}

export function getArtifactActionDisplayContent(meta: ArtifactActionMeta): string {
    const label = getArtifactActionLabel(meta.kind);
    return `${label} · ${meta.artifactTitle}`;
}
