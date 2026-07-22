// Pure rendering logic for the entitlement-names generator. Lives in CommonJS
// so it can be required by both the generator script (Node ESM .mjs) and the
// Jest test (.ts via @swc/jest) without extra config.

function kebabToPascal(id) {
    return id
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function enumKeyFor(id, overrides) {
    return overrides.names?.[id] ?? kebabToPascal(id);
}

// JSDoc comments terminate on `*/` and break on newlines. Chargebee descriptions
// are user-editable, so we defensively collapse whitespace and neutralize `*/`
// to keep the generated TypeScript valid no matter what gets typed in Chargebee.
function sanitizeDescription(text) {
    return text.replace(/\s+/g, ' ').replace(/\*\//g, '* /').trim();
}

function descriptionFor(feature, overrides) {
    const override = overrides.descriptions?.[feature.id];
    const raw = override !== undefined ? override : (feature.description ?? '');
    return sanitizeDescription(raw);
}

// Chargebee feature statuses: 'active' | 'draft' | 'archived' | 'deleted'.
// Archived/deleted entitlements are still emitted into the enum so existing
// references keep compiling, but flagged @deprecated so consumers know to stop
// using them and that they are scheduled for removal (via the `removed`
// override once gone from the codebase).
const DEPRECATION_REASONS = {
    archived: 'Archived in Chargebee and scheduled for removal.',
    deleted: 'Deleted in Chargebee and scheduled for removal.',
};

function deprecationReasonFor(feature) {
    return DEPRECATION_REASONS[feature.status] ?? '';
}

function assertUniqueKeys(features, overrides) {
    const byKey = new Map();
    for (const feature of features) {
        const key = enumKeyFor(feature.id, overrides);
        const existing = byKey.get(key);
        if (existing) {
            throw new Error(
                `Enum key collision: '${key}' is produced by both '${existing}' and '${feature.id}'. ` +
                    `Resolve via overrides.json.`
            );
        }
        byKey.set(key, feature.id);
    }
}

// Allow developers to use entitlement names that exist in dev Chargebee but
// not yet in prod (or vice versa). Release candidates are merged into the
// feature list locally. Once the real Chargebee fetch returns the same id, the
// local entry is silently superseded — its presence in overrides.json becomes a
// no-op and the caller is told to clean it up.
function mergeReleaseCandidateFeatures(features, overrides) {
    const chargebeeIds = new Set(features.map((f) => f.id));
    const releaseCandidates = overrides.releaseCandidates ?? [];
    const supersededByChargebee = [];
    const added = [];
    for (const id of releaseCandidates) {
        if (chargebeeIds.has(id)) {
            supersededByChargebee.push(id);
        } else {
            added.push({ id, description: '' });
        }
    }
    return { features: [...features, ...added], supersededByChargebee };
}

// Entitlements listed in `removed` have been fully deleted from the frontend
// codebase, so we drop them from the enum even though Chargebee may still
// return them (typically as archived). If Chargebee still reports one as
// active, removing it is almost certainly a mistake — we surface it via
// removedStillActive so the caller can warn, but still honor the override.
function filterRemovedFeatures(features, overrides) {
    const removed = new Set(overrides.removed ?? []);
    const removedStillActive = [];
    const kept = [];
    for (const feature of features) {
        if (!removed.has(feature.id)) {
            kept.push(feature);
            continue;
        }
        if (feature.status === 'active') {
            removedStillActive.push(feature.id);
        }
    }
    return { features: kept, removedStillActive };
}

function compareKeys(a, b) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}

function jsDocLinesFor(feature, overrides) {
    const description = descriptionFor(feature, overrides);
    const deprecation = deprecationReasonFor(feature);
    if (!description && !deprecation) {
        return [];
    }
    if (description && !deprecation) {
        return [`    /** ${description} */`];
    }
    const lines = ['    /**'];
    if (description) {
        lines.push(`     * ${description}`);
    }
    lines.push(`     * @deprecated ${deprecation}`);
    lines.push('     */');
    return lines;
}

function render(features, overrides) {
    assertUniqueKeys(features, overrides);
    const sorted = [...features].sort((a, b) => compareKeys(enumKeyFor(a.id, overrides), enumKeyFor(b.id, overrides)));
    const lines = [
        '// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.',
        '// Source of truth: Chargebee features.',
        '// Regenerate: `yarn workspace @proton/payments generate:entitlement-names`.',
        '// Customize enum keys or descriptions in core/entitlements/scripts/overrides.json.',
        '',
        'export enum EntitlementName {',
    ];
    for (const feature of sorted) {
        const key = enumKeyFor(feature.id, overrides);
        lines.push(...jsDocLinesFor(feature, overrides));
        lines.push(`    ${key} = '${feature.id}',`);
    }
    lines.push('}');
    lines.push('');
    return lines.join('\n');
}

module.exports = {
    kebabToPascal,
    enumKeyFor,
    sanitizeDescription,
    descriptionFor,
    deprecationReasonFor,
    assertUniqueKeys,
    mergeReleaseCandidateFeatures,
    filterRemovedFeatures,
    jsDocLinesFor,
    compareKeys,
    render,
};
