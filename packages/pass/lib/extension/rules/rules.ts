import type { RuleV2 } from '@proton/pass/lib/extension/rules/v2/types';
import type { MaybeNull } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';

import type { CompiledRules, DetectionRules, DetectionRulesMatch, RuleNode, RuleVersion } from './types';
import { validateRulesV1 } from './v1/definition';
import { mergeRuleV2, validateRulesV2 } from './v2/definition';

export const getRuleVersion = (experimental: boolean): RuleVersion => (experimental ? '2' : '1');

export const validateRules = (data: unknown): data is DetectionRules => {
    if (!isObject(data)) return false;
    if (!('rules' in data && 'version' in data)) return false;

    switch (data.version) {
        case '1':
            return validateRulesV1(data);
        case '2':
            return validateRulesV2(data);
        default:
            return false;
    }
};

export const parseRules = (data: MaybeNull<string>): MaybeNull<DetectionRules> => {
    try {
        if (!data) throw new Error();
        const rules = JSON.parse(data);
        if (!validateRules(rules)) throw new Error('Invalid rules definition');
        return rules;
    } catch {
        return null;
    }
};

/** Recursively expands array patterns in URL glob strings */
export const expandArrayPattern = (pattern: string): string[] => {
    const match = pattern.match(/\{([^}]+)\}/);
    if (!match) return [pattern];

    const options = match[1].split(',');
    return options.map((opt) => pattern.replace(/\{[^}]+\}/, opt)).flatMap(expandArrayPattern);
};

/** Compiles detection rules into a segment-Trie structure for fast URL matching.
 * Supports wildcard patterns (*) and array expansion syntax ({option1,option2}) */
export const compileRules = <V extends RuleVersion = RuleVersion>({
    rules,
    version,
}: DetectionRules<V>): CompiledRules<V> => {
    const root: RuleNode<V> = { nodes: new Map() };

    Object.entries(rules).forEach(([base, rule]) => {
        expandArrayPattern(base).forEach((pattern) => {
            const slashIdx = pattern.indexOf('/');
            const domain = slashIdx === -1 ? pattern : pattern.slice(0, slashIdx);
            const path = slashIdx === -1 ? '' : pattern.slice(slashIdx);

            const segments = domain.split('.').filter(Boolean);
            if (path) segments.push(path);

            let curr = root;
            segments.forEach((segment, idx) => {
                curr.nodes ??= new Map();
                if (!curr.nodes.has(segment)) curr.nodes.set(segment, {});
                if (idx === segments.length - 1) curr.nodes.get(segment)!.rule = rule;
                else curr = curr.nodes.get(segment)!;
            });
        });
    });

    return { version, nodes: root.nodes! };
};

export const matchSegments = <V extends RuleVersion>(
    node: RuleNode<V>,
    [head, ...tail]: string[],
    path?: string
): RuleNode<V>[] => {
    if (!head) {
        const matches = [node];

        if (path && node.nodes) {
            for (const [subpath, subMatch] of node.nodes) {
                if (path.startsWith(subpath)) matches.push(subMatch);
            }
        }

        return matches;
    }

    const exactMatch = node.nodes?.get(head);
    const wildcardMatch = node.nodes?.get('*');

    const exact = exactMatch ? matchSegments(exactMatch, tail, path) : [];
    const wildcard = wildcardMatch ? matchSegments(wildcardMatch, tail, path) : [];

    return exact.concat(wildcard);
};

export const matchRules = (rules: CompiledRules, { hostname, pathname }: URL): MaybeNull<DetectionRulesMatch> => {
    const segments = hostname.split('.');
    const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : undefined;

    switch (rules.version) {
        case '1': {
            const matches = matchSegments(rules, segments, path);
            if (matches.length === 0) return null;
            const exclude = matches.flatMap(({ rule }) => rule ?? []);
            return { version: '1', exclude };
        }

        case '2': {
            const matches = matchSegments(rules, segments, path);
            if (matches.length === 0) return null;
            const rule = matches.reduce<RuleV2>((acc, node) => (node.rule ? mergeRuleV2(acc, node.rule) : acc), {});
            return { version: '2', ...rule };
        }

        default:
            return null;
    }
};
