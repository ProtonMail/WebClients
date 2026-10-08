import fs from 'node:fs';
import path from 'node:path';

// Update this path if the registry moves to a different location.
const CHECKS_SOURCE_RELATIVE_PATH = path.join('packages', 'payments', 'core', 'entitlements', 'checks.ts');

/**
 * Methods of the entitlement resolvers (`EntitlementResolverForSelection` /
 * `EntitlementResolverForOrgAndUser`, see `packages/payments/core/entitlements/interface.ts`).
 */
const CONDITION_METHODS = ['hasMatchingSubscription', 'findSubscriptionsMatching'];

const RESOLVER_METHODS = [
    ...CONDITION_METHODS,
    'hasEntitlement',
    'resolveTotal',
    'quantityTotal',
    'resolveForMember',
    'quantityForMember',
];

const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const collectTopLevelKeys = (source, openBraceIndex) => {
    const keys = [];
    let depth = 0;
    let expectKey = false;

    for (let index = openBraceIndex; index < source.length; index++) {
        const char = source[index];

        if (char === '{' || char === '(' || char === '[') {
            depth += 1;
            expectKey = depth === 1;
            continue;
        }

        if (char === '}' || char === ')' || char === ']') {
            depth -= 1;

            if (depth === 0) {
                break;
            }

            continue;
        }

        if (depth !== 1 || /\s/.test(char)) {
            continue;
        }

        if (char === ',') {
            expectKey = true;
            continue;
        }

        if (!expectKey) {
            continue;
        }

        expectKey = false;
        const [key] = /^[A-Za-z_$][\w$]*(?=\s*:)/.exec(source.slice(index, index + 100)) ?? [];

        if (key) {
            keys.push(key);
            index += key.length - 1;
        }
    }

    return keys;
};

/**
 * Names of the checks registered in `entitlementChecksForSelection` / `entitlementChecksForOrgAndUser`.
 * Parsed out of the registry source so this rule never carries its own copy of the list.
 */
export const parseRegisteredCheckNames = (checksSource) => {
    const source = stripComments(checksSource);
    const names = new Set();

    for (const match of source.matchAll(/export const entitlementChecks\w*\s*=\s*{/g)) {
        const openBraceIndex = match.index + match[0].length - 1;

        for (const key of collectTopLevelKeys(source, openBraceIndex)) {
            names.add(key);
        }
    }

    return names;
};

const checkNamesByRepositoryRoot = new Map();

const readRegisteredCheckNames = (startPath) => {
    let current = path.dirname(startPath);

    while (true) {
        const checksSourcePath = path.join(current, CHECKS_SOURCE_RELATIVE_PATH);

        if (fs.existsSync(checksSourcePath)) {
            if (!checkNamesByRepositoryRoot.has(current)) {
                checkNamesByRepositoryRoot.set(
                    current,
                    parseRegisteredCheckNames(fs.readFileSync(checksSourcePath, 'utf8'))
                );
            }

            return checkNamesByRepositoryRoot.get(current);
        }

        const parent = path.dirname(current);

        if (parent === current) {
            // Outside the monorepo (or the registry moved): fall back to resolver methods only.
            return new Set();
        }

        current = parent;
    }
};

/**
 * The registry itself is where a combination of entitlements is given a name, so boolean composition
 * belongs there — and only there.
 */
export const isEntitlementChecksRegistry = (context) =>
    Boolean(context.filename) && path.normalize(context.filename).endsWith(CHECKS_SOURCE_RELATIVE_PATH);

export const getRegisteredCheckNames = (context) =>
    context.filename && path.isAbsolute(context.filename) ? readRegisteredCheckNames(context.filename) : new Set();

const getCalleeName = (node) => {
    if (node.type !== 'CallExpression') {
        return null;
    }

    const { callee } = node;

    if (callee.type === 'Identifier') {
        return callee.name;
    }

    if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
        return callee.property.name;
    }

    return null;
};

const getProperty = (objectExpression, name) =>
    objectExpression.properties.find(
        (property) => property.type === 'Property' && !property.computed && property.key.name === name
    );

/**
 * The `{ includes, excludes }` argument of `hasMatchingSubscription` / `findSubscriptionsMatching`, when it is
 * written inline. `undefined` for anything else, so a condition assembled elsewhere — or an `includes` that is not
 * an array literal — is left alone by these rules.
 */
export const getEntitlementConditions = (node) => {
    if (!CONDITION_METHODS.includes(getCalleeName(node))) {
        return undefined;
    }

    const [conditions] = node.arguments;

    if (conditions?.type !== 'ObjectExpression') {
        return undefined;
    }

    const includes = getProperty(conditions, 'includes');

    if (includes?.value.type !== 'ArrayExpression') {
        return undefined;
    }

    return { includes: includes.value, excludes: getProperty(conditions, 'excludes')?.value };
};

export const isEntitlementResolverCall = (node) => {
    const calleeName = getCalleeName(node);

    if (!RESOLVER_METHODS.includes(calleeName)) {
        return false;
    }

    return !CONDITION_METHODS.includes(calleeName) || getEntitlementConditions(node) !== undefined;
};
