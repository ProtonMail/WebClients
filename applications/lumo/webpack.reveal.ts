import path from 'path';
import type { Configuration, RuleSetRule } from 'webpack';

// Matches reveal.js's own dist output specifically (not any other package's .js/.css), so it can
// be pulled in as a raw string (asset/source) instead of being transpiled/bundled normally — Lumo
// embeds this text as inline <script>/<style> content inside a sandboxed artifact iframe rather
// than loading it as a real module or stylesheet in the app itself.
export const REVEAL_JS_RAW_SOURCE = /reveal\.js[\\/]dist[\\/](reveal\.(js|css)|theme[\\/]simple\.css)$/;

// reveal.js's package.json `exports` field only allows specific renamed subpaths (e.g.
// `reveal.js/reveal.css`, not `reveal.js/dist/reveal.css`) and resolves the bare specifier to its
// ESM build under webpack's `import` condition — not the UMD build Lumo needs to embed as a
// plain, non-module inline <script> in a sandboxed artifact iframe. Aliasing straight to the
// literal dist file paths bypasses the exports map entirely (alias targets are resolved as
// filesystem paths, not specifiers). `require.resolve` here runs under Node's own CJS
// conditions, which the "." export maps to `dist/reveal.js` (the UMD build) — unlike webpack's
// resolution of the same bare specifier from application code.
export function getRevealJsResolveAliases(): Record<string, string> {
    const revealJsDist = path.dirname(require.resolve('reveal.js'));

    return {
        'reveal.js/dist/reveal.js': path.join(revealJsDist, 'reveal.js'),
        'reveal.js/dist/reveal.css': path.join(revealJsDist, 'reveal.css'),
        'reveal.js/dist/theme/simple.css': path.join(revealJsDist, 'theme', 'simple.css'),
    };
}

// Prepended to module.rules so reveal.js dist files are handled as raw source before the shared
// pack CSS loader (which would otherwise extract them as real app stylesheets).
export function getRevealJsRawSourceRule(): RuleSetRule {
    return {
        test: REVEAL_JS_RAW_SOURCE,
        type: 'asset/source',
    };
}

type RuleSetRules = NonNullable<NonNullable<Configuration['module']>['rules']>;

function isRuleSetRule(rule: RuleSetRules[number]): rule is RuleSetRule {
    return !!rule && typeof rule === 'object';
}

function patchCssLoaderExcludeForRevealJs(rules: RuleSetRules): void {
    for (const rule of rules) {
        if (!isRuleSetRule(rule)) {
            continue;
        }

        if ('oneOf' in rule && Array.isArray(rule.oneOf)) {
            patchCssLoaderExcludeForRevealJs(rule.oneOf);
        }

        if (!(rule.test instanceof RegExp) || !rule.test.test('file.css')) {
            continue;
        }

        const existingExclude = rule.exclude;
        if (!existingExclude) {
            rule.exclude = REVEAL_JS_RAW_SOURCE;
            continue;
        }

        if (existingExclude instanceof RegExp) {
            rule.exclude = [existingExclude, REVEAL_JS_RAW_SOURCE];
            continue;
        }

        if (Array.isArray(existingExclude)) {
            const alreadyExcluded = existingExclude.some(
                (exclude) => exclude instanceof RegExp && exclude.toString() === REVEAL_JS_RAW_SOURCE.toString()
            );
            if (!alreadyExcluded) {
                rule.exclude = [...existingExclude, REVEAL_JS_RAW_SOURCE];
            }
        }
    }
}

/** Lumo-only webpack hooks for embedding reveal.js as inline iframe source text. */
export function applyRevealJsWebpackConfig(config: Configuration): void {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
        ...config.resolve.alias,
        ...getRevealJsResolveAliases(),
    };

    config.module = config.module ?? { rules: [] };
    config.module.rules = config.module.rules ?? [];
    config.module.rules.unshift(getRevealJsRawSourceRule());
    patchCssLoaderExcludeForRevealJs(config.module.rules);
}
