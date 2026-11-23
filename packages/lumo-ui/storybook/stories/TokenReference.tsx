import { useEffect, useRef, useState } from 'react';

import type { Appearance } from './ThemeScope';
import { ThemeStyles, scopeClass } from './ThemeScope';

type TokenValue = {
    value: string;
    label: string;
};

type Token = {
    name: string;
    light: TokenValue;
    dark: TokenValue;
    color: boolean;
};

const semanticColors = /^--lumo-(glyph|border|control|page|panel|notice|overlay|layer|scrim|signal|white|black)/;
const componentColors = /^--lumo-artifact-/;
const colorPrimitives = /^--(color-|iris-|neutral-|red-|amber-|teal-|sky-)/;

const groups = [
    {
        title: 'Primitive',
        id: 'colors-primitive',
        colorGroup: true,
        themed: false,
        description: 'Raw palette values. Use semantic or component colors in UI styles.',
        match: colorPrimitives,
    },
    {
        title: 'Semantic',
        id: 'colors-semantic',
        colorGroup: true,
        themed: true,
        description: 'Shared color roles that adapt to each theme.',
        match: semanticColors,
    },
    {
        title: 'Component',
        id: 'colors-component',
        colorGroup: true,
        themed: true,
        description: 'Colors reserved for a specific component family.',
        match: componentColors,
    },
    {
        title: 'Spacing',
        id: 'spacing',
        description: 'Token suffixes are pixels; Proton utility suffixes use a different scale.',
        match: /^--lumo-space-/,
    },
    {
        title: 'Border width',
        id: 'border-width',
        description:
            '1px for edges and dividers, 1.5px for checkbox and radio outlines, and 2px for focus and error outlines. Icon strokes use their own token.',
        match: /^--border-width-(1|1-5|2)$/,
    },
    {
        title: 'Radius',
        id: 'radius',
        description: 'Corner radii for controls and surfaces.',
        match: /^--lumo-radius-/,
    },
    {
        title: 'Elevation',
        id: 'elevation',
        description: 'Shadows for raised surfaces, independent of background color and stacking order.',
        match: /^--lumo-elevation-/,
    },
    {
        title: 'Typography',
        id: 'typography',
        description: 'Complete type roles, font families, sizes, tracking, and weights.',
        match: /^--lumo-(type|font)-/,
    },
    {
        title: 'Icons',
        id: 'icons',
        description: 'Icon dimensions and stroke width.',
        match: /^--lumo-icon-/,
    },
    {
        title: 'Opacity',
        id: 'opacity',
        description: 'Whole-element opacity steps, from most transparent to most opaque.',
        match: /^--lumo-opacity-/,
    },
    {
        title: 'Motion',
        id: 'motion',
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
                        if (semanticColors.test(name) || componentColors.test(name)) {
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

function getHexColor(value: string, context: CanvasRenderingContext2D | null) {
    if (!context) {
        return value;
    }

    // The browser normalizes opaque sRGB colors to hex and translucent colors to rgba().
    context.fillStyle = value;
    const color = String(context.fillStyle);
    const channels = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (!channels) {
        return color;
    }

    const [, red, green, blue, alpha] = channels;
    const bytes = [Number(red), Number(green), Number(blue)];
    if (alpha !== undefined && Number(alpha) < 1) {
        bytes.push(Math.round(Number(alpha) * 255));
    }
    return `#${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function ComponentTokenExamples() {
    return (
        <div className="lumo-catalog sb-unstyled mb-4">
            {(['light', 'dark'] as const).map((appearance) => (
                <div
                    key={appearance}
                    className={`lumo-catalog__panel min-w-0 p-4 border radius-12 lumo-color-glyph lumo-bg-panel ${scopeClass(appearance)}`}
                >
                    <p className="mb-3 lumo-label-medium">{appearance === 'light' ? 'Light' : 'Dark'}</p>
                    <pre className="m-0 p-3 overflow-auto radius-8 lumo-body-small lumo-font-mono lumo-bg-artifact-code-bg">
                        <code>
                            <span className="lumo-color-artifact-syntax-line-number" aria-hidden="true">
                                1{' '}
                            </span>
                            <span className="lumo-color-artifact-syntax-comment">{'// Code creation'}</span>
                            {'\n'}
                            <span className="lumo-color-artifact-syntax-line-number" aria-hidden="true">
                                2{' '}
                            </span>
                            <span className="lumo-color-artifact-syntax-keyword">const</span>
                            {' title: '}
                            <span className="lumo-color-artifact-syntax-type">string</span>
                            {' = '}
                            <span className="lumo-color-artifact-syntax-string">{'"Hello"'}</span>
                            {';\n'}
                            <span className="lumo-color-artifact-syntax-line-number" aria-hidden="true">
                                3{' '}
                            </span>
                            <span className="lumo-bg-artifact-syntax-selection">
                                <span className="lumo-color-artifact-syntax-function">repeat</span>
                                {'(title, '}
                                <span className="lumo-color-artifact-syntax-number">3</span>
                                {');'}
                            </span>
                        </code>
                    </pre>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {(
                            [
                                ['doc', 'Document'],
                                ['code', 'Code'],
                                ['web', 'Web page'],
                            ] as const
                        ).map(([kind, label]) => (
                            <span
                                key={kind}
                                className={`inline-flex items-center gap-2 p-2 border lumo-border-artifact-${kind} radius-8 lumo-body-small lumo-bg-artifact-${kind}-tile`}
                            >
                                <span className={`lumo-color-artifact-${kind}-icon`} aria-hidden="true">
                                    ▧
                                </span>
                                {label}
                            </span>
                        ))}
                    </div>
                    <div className="mt-3 p-2 radius-4 lumo-bg-artifact-skeleton" aria-label="Creation skeleton color" />
                </div>
            ))}
        </div>
    );
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
        const context = document.createElement('canvas').getContext('2d');
        // Read the loaded CSS rather than keeping a second copy of token values in documentation.
        setTokens(
            Array.from(new Set([...Array.from(light), ...getDeclaredCustomProperties()]))
                .filter((name) => groups.some(({ match }) => match.test(name)) && light.getPropertyValue(name).trim())
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                .map((name) => {
                    const lightValue = light.getPropertyValue(name).trim();
                    const color = CSS.supports('color', lightValue);
                    const getValue = (appearance: Appearance, value: string): TokenValue => {
                        if (!color) {
                            return { value, label: value };
                        }
                        const declaration = declarations[appearance].get(name) ?? declarations.base.get(name);
                        const alias = declaration?.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1];
                        return { value, label: alias ?? getHexColor(value, context) };
                    };

                    return {
                        name,
                        light: getValue('light', lightValue),
                        dark: getValue('dark', dark.getPropertyValue(name).trim()),
                        color,
                    };
                })
        );
    }, []);
    const renderGroup = ({ title, id, description, match, themed, colorGroup }: (typeof groups)[number]) => (
        <section className="ds-section" id={id} key={id}>
            <div className="ds-section__heading">
                {colorGroup ? <h3>{title}</h3> : <h2>{title}</h2>}
                <span className="ds-section__count">{tokens.filter(({ name }) => match.test(name)).length} tokens</span>
            </div>
            <p className="ds-section__description">{description}</p>
            {match === componentColors && <ComponentTokenExamples />}
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
                                    {(themed ? (['light', 'dark'] as const) : (['light'] as const)).map((theme) => {
                                        const { value, label } = token[theme];
                                        return (
                                            <td key={theme}>
                                                <div className="ds-token-table__value">
                                                    {token.color && (
                                                        <span
                                                            className="ds-token-table__swatch"
                                                            style={{ backgroundColor: value }}
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <code>{label}</code>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
    return (
        <>
            <nav aria-label="Token sections" className="mt-4">
                <ul>
                    <li>
                        <a href="#colors">Colors</a>
                        <ul>
                            {groups
                                .filter(({ colorGroup }) => colorGroup)
                                .map(({ title, id }) => (
                                    <li key={id}>
                                        <a href={`#${id}`}>{title}</a>
                                    </li>
                                ))}
                        </ul>
                    </li>
                    {groups
                        .filter(({ colorGroup }) => !colorGroup)
                        .map(({ title, id }) => (
                            <li key={id}>
                                <a href={`#${id}`}>{title}</a>
                            </li>
                        ))}
                </ul>
            </nav>
            <ThemeStyles />
            <div ref={lightRef} className={scopeClass('light')} hidden />
            <div ref={darkRef} className={scopeClass('dark')} hidden />
            {tokens.length === 0 && <output>Loading token values…</output>}
            <section className="ds-section" id="colors">
                <h2>Colors</h2>
                <p className="ds-section__description">
                    A token gives a design decision a reusable name. An alias references another token instead of
                    repeating its value. Lumo organizes colors into three layers:
                </p>
                <div className="ds-table">
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Layer</th>
                                <th scope="col">Purpose</th>
                                <th scope="col">Example</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <th scope="row">Primitive</th>
                                <td>Raw, reusable palette values.</td>
                                <td>
                                    <code>--iris-100</code>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Semantic</th>
                                <td>Shared UI meaning, such as control borders or secondary text.</td>
                                <td>
                                    <code>--lumo-control-border</code>, <code>--lumo-glyph-mid</code>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row">Component</th>
                                <td>Colors specific to a component family, such as code syntax.</td>
                                <td>
                                    <code>--lumo-artifact-syntax-keyword</code>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="ds-section__description">
                    Use semantic roles for shared UI and component tokens for their designated family. Both adapt to
                    light and dark themes; component colors do not always alias the primitive palette.
                </p>
                {groups.filter(({ colorGroup }) => colorGroup).map(renderGroup)}
            </section>
            {groups.filter(({ colorGroup }) => !colorGroup).map(renderGroup)}
        </>
    );
}
