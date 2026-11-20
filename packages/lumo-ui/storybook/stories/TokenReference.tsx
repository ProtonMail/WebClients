import { useEffect, useRef, useState } from 'react';

import type { Appearance } from './ThemeScope';
import { ThemeStyles, scopeClass } from './ThemeScope';

type Token = {
    name: string;
    light: string;
    dark: string;
    color: boolean;
    primitiveLabels?: Record<Appearance, string>;
};

const semanticColors = /^--lumo-(glyph|border|control|canvas|panel|overlay|layer|scrim|signal|artifact|white|black)/;
const colorPrimitives = /^--(color-|iris-|neutral-|red-|amber-|teal-|sky-)/;

const groups = [
    {
        title: 'Semantic colors',
        themed: true,
        description:
            'Use roles that describe intent. Each swatch shows its primitive name or identifies a custom color.',
        match: semanticColors,
    },
    {
        title: 'Color primitives',
        themed: true,
        description: 'The raw palette. Prefer semantic roles in component styles.',
        match: colorPrimitives,
    },
    {
        title: 'Spacing',
        description: 'Token suffixes are pixels; Proton utility suffixes use a different scale.',
        match: /^--lumo-space-/,
    },
    {
        title: 'Radius',
        description: 'Corner radii for controls and surfaces.',
        match: /^--lumo-radius-/,
    },
    {
        title: 'Elevation',
        description: 'Shadows for raised surfaces, independent of background color and stacking order.',
        match: /^--lumo-elevation-/,
    },
    {
        title: 'Typography',
        description: 'Complete type roles, font families, tracking, and weights.',
        match: /^--lumo-(type|font)-/,
    },
    {
        title: 'Icons',
        description: 'Icon dimensions and stroke width.',
        match: /^--lumo-icon-/,
    },
    {
        title: 'Opacity',
        description: 'Whole-element opacity steps, from most transparent to most opaque.',
        match: /^--lumo-opacity-/,
    },
    {
        title: 'Motion',
        description: 'Pair a duration with an easing curve. Components choose the animated properties.',
        match: /^--lumo-(duration|easing)-/,
    },
];

function getColorDeclarations() {
    const base = new Map<string, string>();
    const light = new Map<string, string>();
    const dark = new Map<string, string>();
    const selectors = new Map([
        [':root', base],
        [`.${scopeClass('light').split(' ').join('.')}`, light],
        [`.${scopeClass('dark').split(' ').join('.')}`, dark],
    ]);

    // Computed styles resolve var() references, so read the authored declarations for the labels.
    for (const sheet of document.styleSheets) {
        if (sheet.href && new URL(sheet.href).origin !== location.origin) {
            continue;
        }
        for (const rule of sheet.cssRules) {
            if (rule instanceof CSSStyleRule) {
                const declarations = selectors.get(rule.selectorText);
                if (declarations) {
                    for (const name of rule.style) {
                        if (semanticColors.test(name)) {
                            declarations.set(name, rule.style.getPropertyValue(name).trim());
                        }
                    }
                }
            }
        }
    }
    return { base, light, dark };
}

// Not every engine lists custom properties when iterating computed styles, so also read the authored names.
function getDeclaredCustomProperties() {
    const names = new Set<string>();
    const visit = (rules: CSSRuleList) => {
        for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
                for (const name of rule.style) {
                    if (name.startsWith('--')) {
                        names.add(name);
                    }
                }
            }
            if ('cssRules' in rule) {
                visit((rule as CSSGroupingRule).cssRules);
            }
        }
    };
    for (const sheet of document.styleSheets) {
        if (!sheet.href || new URL(sheet.href).origin === location.origin) {
            visit(sheet.cssRules);
        }
    }
    return names;
}

function getPrimitiveLabel(declaration: string | undefined) {
    const reference = declaration?.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1];
    return reference && colorPrimitives.test(reference) ? reference.slice(2) : 'Custom color';
}

export function TokenReference() {
    const lightRef = useRef<HTMLDivElement>(null);
    const darkRef = useRef<HTMLDivElement>(null);
    const [tokens, setTokens] = useState<Token[]>([]);
    useEffect(() => {
        if (!lightRef.current || !darkRef.current) {
            return;
        }
        const light = getComputedStyle(lightRef.current);
        const dark = getComputedStyle(darkRef.current);
        const declarations = getColorDeclarations();
        // Read the loaded CSS rather than keeping a second copy of token values in documentation.
        setTokens(
            Array.from(new Set([...Array.from(light), ...getDeclaredCustomProperties()]))
                .filter((name) => groups.some(({ match }) => match.test(name)) && light.getPropertyValue(name).trim())
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                .map((name) => ({
                    name,
                    light: light.getPropertyValue(name).trim(),
                    dark: dark.getPropertyValue(name).trim(),
                    color: CSS.supports('color', light.getPropertyValue(name).trim()),
                    primitiveLabels: semanticColors.test(name)
                        ? {
                              light: getPrimitiveLabel(declarations.light.get(name) ?? declarations.base.get(name)),
                              dark: getPrimitiveLabel(declarations.dark.get(name) ?? declarations.base.get(name)),
                          }
                        : undefined,
                }))
        );
    }, []);
    return (
        <>
            <ThemeStyles />
            <div ref={lightRef} className={scopeClass('light')} hidden />
            <div ref={darkRef} className={scopeClass('dark')} hidden />
            {tokens.length === 0 && <output>Loading token values…</output>}
            {groups.map(({ title, description, match, themed }) => (
                <section className="ds-section" key={title}>
                    <div className="ds-section__heading">
                        <h2>{title}</h2>
                        <span className="ds-section__count">
                            {tokens.filter(({ name }) => match.test(name)).length} tokens
                        </span>
                    </div>
                    <p className="ds-section__description">{description}</p>
                    <div className="ds-table">
                        <table className="ds-token-table">
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>{themed ? 'Light' : 'Value'}</th>
                                    {themed && <th>Dark</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {tokens
                                    .filter(({ name }) => match.test(name))
                                    .map((token) => (
                                        <tr key={token.name}>
                                            <th scope="row">
                                                <code>{token.name}</code>
                                            </th>
                                            {(themed ? (['light', 'dark'] as const) : (['light'] as const)).map(
                                                (theme) => (
                                                    <td key={theme}>
                                                        <div className="ds-token-table__value">
                                                            {token.color && (
                                                                <span
                                                                    className="ds-token-table__swatch"
                                                                    style={{ backgroundColor: token[theme] }}
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <code>
                                                                {token.primitiveLabels?.[theme] ?? token[theme]}
                                                            </code>
                                                        </div>
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </>
    );
}
