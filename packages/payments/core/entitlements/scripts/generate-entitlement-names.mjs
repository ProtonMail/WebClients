#!/usr/bin/env node
// Generate packages/payments/core/entitlements/entitlement-names.ts from the
// Chargebee features API. Chargebee is the source of truth; this file is
// regenerated wholesale on every run. Use --check to fail when the committed
// file is stale, or when releaseCandidates in overrides.json contains an id
// that already exists in the fetched (prod) Chargebee catalog (CI drift check).
//
// Required environment variables (loaded from core/entitlements/scripts/.env
// via `node --env-file-if-exists`, or supplied directly in CI):
//   CHARGEBEE_API_KEY — Chargebee site API key
//   CHARGEBEE_SITE    — Chargebee site URL, e.g. https://proton-test.chargebee.com
//
// Customize enum keys or JSDoc descriptions in ./overrides.json. The same file
// supports a `releaseCandidates` array of Chargebee IDs that exist in dev but
// not yet in prod (or vice versa) — useful when you need to use an entitlement
// name in code before it has been promoted upstream. In --check mode the
// script fails if a release candidate already exists in the fetched catalog,
// so the stale entry must be dropped from overrides.json.
//
// Archived/deleted entitlements are kept in the enum (so existing references
// keep compiling) but flagged @deprecated. To stop emitting one entirely, add
// its id to the `removed` array in overrides.json once every reference is gone
// from the codebase.
//
// Notes for future maintainers:
//
// - CI secret rotation: today --check requires CHARGEBEE_API_KEY in the CI
//   runner.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { mergeReleaseCandidateFeatures, filterRemovedFeatures, render } = require('./lib.js');

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OVERRIDES_PATH = join(SCRIPT_DIR, 'overrides.json');
const OUTPUT_PATH = join(SCRIPT_DIR, '..', 'entitlement-names.ts');

async function fetchAllFeatures(auth, site) {
    const features = [];
    let offset;
    do {
        const params = new URLSearchParams({ limit: '100' });
        if (offset) {
            params.set('offset', offset);
        }
        const url = `${site}/api/v2/features?${params}`;
        const response = await fetch(url, { headers: { Authorization: auth } });
        if (!response.ok) {
            throw new Error(`GET /features failed: HTTP ${response.status} ${await response.text()}`);
        }
        const json = await response.json();
        for (const row of json.list) {
            features.push(row.feature);
        }
        offset = json.next_offset;
    } while (offset);
    return features;
}

function readCurrent(path) {
    try {
        return readFileSync(path, 'utf8');
    } catch {
        return '';
    }
}

async function main() {
    const apiKey = process.env.CHARGEBEE_API_KEY;
    const site = process.env.CHARGEBEE_SITE;
    if (!apiKey || !site) {
        console.error('CHARGEBEE_API_KEY and CHARGEBEE_SITE must be set (see core/entitlements/scripts/.env).');
        process.exit(1);
    }

    const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8'));
    const auth = 'Basic ' + Buffer.from(apiKey + ':').toString('base64');
    const checkMode = process.argv.includes('--check');

    const chargebeeFeatures = await fetchAllFeatures(auth, site);
    const { features: withReleaseCandidates, supersededByChargebee } = mergeReleaseCandidateFeatures(
        chargebeeFeatures,
        overrides
    );
    if (supersededByChargebee.length) {
        console.error(
            `Release-candidate entitlements are already in Chargebee (prod) and must be removed from releaseCandidates in overrides.json: ${supersededByChargebee.join(', ')}`
        );
    }
    const { features, removedStillActive } = filterRemovedFeatures(withReleaseCandidates, overrides);
    if (removedStillActive.length) {
        console.warn(
            `End-of-life entitlements are still active in Chargebee — they are excluded from the enum, but verify the "removed" list in overrides.json: ${removedStillActive.join(', ')}`
        );
    }
    const next = render(features, overrides);
    const current = readCurrent(OUTPUT_PATH);

    if (checkMode && supersededByChargebee.length) {
        console.error('overrides.json releaseCandidates are out of sync with Chargebee.');
        console.error('Remove the ids above from releaseCandidates and commit the change.');
        process.exit(1);
    }

    if (current === next) {
        console.log(`entitlement-names.ts is up to date (${features.length} entitlements).`);
        return;
    }

    if (checkMode) {
        console.error('entitlement-names.ts is out of sync with Chargebee.');
        console.error('Run: pnpm --filter @proton/payments run generate:entitlement-names');
        process.exit(1);
    }

    writeFileSync(OUTPUT_PATH, next);
    console.log(`Wrote ${features.length} entitlements to entitlement-names.ts`);
}

await main();
