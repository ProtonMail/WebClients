import type { Config } from 'vega-lite';

import {
    PROTON_CATEGORY_COLORS,
    PROTON_DRIVE_RED,
    PROTON_FONT_BODY,
    PROTON_HAIRLINE,
    PROTON_INK,
    PROTON_INK_DIM,
    PROTON_INK_FAINT,
    PROTON_PRODUCT_COLORS,
    PROTON_PRODUCT_DOMAIN,
    PROTON_PURPLE,
    PROTON_PURPLE_LIGHT,
    PROTON_PURPLE_MID,
    PROTON_PURPLE_TINT,
    PROTON_SEQUENTIAL_RAMP,
    PROTON_STATIC_COLOR_BAND_FIELD,
} from './protonChartTokens';

export {
    PROTON_BAR_COLOR,
    PROTON_CATEGORY_COLORS,
    PROTON_CHART_COLORS,
    PROTON_LINE_ACCENT,
    PROTON_LINE_COLOR,
    PROTON_PURPLE,
} from './protonChartTokens';

const DARK_AXIS = {
    ink: '#FFFFFF',
    inkDim: '#ADABA9',
    inkFaint: '#6A6580',
    hairline: '#4A4658',
    grid: '#343140',
    purple: PROTON_PURPLE_MID,
} as const;

function readCssColor(element: Element | null | undefined, variable: string, fallback: string): string {
    if (!element || typeof window === 'undefined') {
        return fallback;
    }

    const value = window.getComputedStyle(element).getPropertyValue(variable).trim();
    return value || fallback;
}

export function isDarkSurface(element: Element | null | undefined): boolean {
    if (!element || typeof window === 'undefined') {
        return false;
    }

    const background = readCssColor(element, '--background-norm', '#FFFFFF');
    return background.startsWith('#')
        ? Number.parseInt(background.slice(1, 3), 16) < 128
        : background.startsWith('rgb') && background.includes('0, 0, 0');
}

function buildProtonConfigTokens(dark: boolean) {
    if (dark) {
        return {
            ink: readCssColor(undefined, '--text-norm', DARK_AXIS.ink),
            inkDim: readCssColor(undefined, '--text-weak', DARK_AXIS.inkDim),
            inkFaint: DARK_AXIS.inkFaint,
            hairline: DARK_AXIS.hairline,
            grid: DARK_AXIS.grid,
            purple: DARK_AXIS.purple,
        };
    }

    return {
        ink: PROTON_INK,
        inkDim: PROTON_INK_DIM,
        inkFaint: PROTON_INK_FAINT,
        hairline: PROTON_HAIRLINE,
        grid: PROTON_PURPLE_TINT,
        purple: PROTON_PURPLE,
    };
}

/**
 * Registered Proton Vega-Lite theme — mirrors proton-vega-theme.json from the design reference.
 */
export function getProtonVegaConfig(themeRoot?: Element | null): Config {
    const dark = isDarkSurface(themeRoot);
    const tokens = buildProtonConfigTokens(dark);

    if (themeRoot && !dark) {
        tokens.ink = readCssColor(themeRoot, '--text-norm', PROTON_INK);
        tokens.inkDim = readCssColor(themeRoot, '--text-weak', PROTON_INK_DIM);
    }

    return {
        background: 'transparent',
        font: PROTON_FONT_BODY,
        title: {
            font: PROTON_FONT_BODY,
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 18,
            color: tokens.ink,
            anchor: 'start',
            offset: 8,
            subtitleFont: PROTON_FONT_BODY,
            subtitleFontSize: 11.5,
            subtitleFontWeight: 400,
            subtitleColor: tokens.inkDim,
            subtitleLineHeight: 16,
            subtitlePadding: 4,
        },
        axis: {
            labelFont: PROTON_FONT_BODY,
            titleFont: PROTON_FONT_BODY,
            labelFontSize: 10,
            titleFontSize: 10,
            labelFontWeight: 400,
            titleFontWeight: 500,
            labelColor: tokens.inkDim,
            titleColor: tokens.inkDim,
            gridColor: tokens.grid,
            domainColor: tokens.hairline,
            tickColor: tokens.hairline,
            gridDash: [2, 2],
            gridOpacity: 1,
            labelPadding: 6,
            titlePadding: 10,
        },
        axisY: { grid: true, domain: false },
        axisX: { grid: false, domain: true },
        legend: {
            labelFont: PROTON_FONT_BODY,
            titleFont: PROTON_FONT_BODY,
            labelFontSize: 10.5,
            titleFontSize: 10.5,
            labelFontWeight: 400,
            titleFontWeight: 600,
            labelColor: '#4A4560',
            titleColor: tokens.ink,
            symbolSize: 90,
            symbolType: 'circle',
            orient: 'top',
            titleLimit: 0,
            padding: 8,
            columnPadding: 16,
        },
        range: {
            category: [...PROTON_CATEGORY_COLORS],
            diverging: [PROTON_DRIVE_RED, PROTON_PURPLE_TINT, PROTON_PURPLE],
            ramp: [...PROTON_SEQUENTIAL_RAMP],
            heatmap: [...PROTON_SEQUENTIAL_RAMP],
            ordinal: [PROTON_PURPLE, '#8B6BFF', PROTON_PURPLE_MID, PROTON_PURPLE_LIGHT, '#DAC7FF', PROTON_PURPLE_TINT],
        },
        line: { color: tokens.purple, strokeWidth: 2.25, interpolate: 'monotone' },
        trail: { color: tokens.purple, strokeWidth: 2 },
        point: { color: tokens.purple, filled: true, size: 50, opacity: 0.85, strokeWidth: 0 },
        circle: { color: tokens.purple, opacity: 0.75, strokeWidth: 0 },
        square: { color: tokens.purple, opacity: 0.85 },
        bar: { color: tokens.purple, cornerRadiusEnd: 3, binSpacing: 1 },
        area: {
            color: tokens.purple,
            opacity: 0.18,
            interpolate: 'monotone',
            line: { color: tokens.purple, strokeWidth: 2.25 },
        },
        arc: { fill: tokens.purple, padAngle: 0.015, stroke: '#ffffff', strokeWidth: 1.5 },
        rect: { fill: tokens.purple, cornerRadius: 2, stroke: '#ffffff', strokeWidth: 0.5 },
        tick: { color: tokens.purple, opacity: 0.7, thickness: 1.5, bandSize: 14 },
        boxplot: {
            box: { fill: PROTON_PURPLE_LIGHT, stroke: tokens.purple, strokeWidth: 1.5 },
            median: { stroke: tokens.purple, strokeWidth: 2.5 },
            outliers: { color: PROTON_DRIVE_RED, size: 30, opacity: 0.7 },
            rule: { stroke: tokens.purple, strokeWidth: 1 },
            ticks: { stroke: tokens.purple, strokeWidth: 1 },
        },
        errorband: {
            band: { fill: tokens.purple, opacity: 0.12 },
            borders: { stroke: tokens.purple, strokeWidth: 1, opacity: 0.4, strokeDash: [3, 3] },
        },
        errorbar: {
            rule: { stroke: tokens.inkDim, strokeWidth: 1.5 },
            ticks: { stroke: tokens.inkDim, strokeWidth: 1.5, size: 6 },
        },
        rule: { color: tokens.hairline, strokeWidth: 1 },
        text: { color: '#4A4560', font: PROTON_FONT_BODY, fontSize: 10.5 },
        view: { stroke: 'transparent', continuousWidth: 500, continuousHeight: 220 },
        concat: { spacing: 16 },
        facet: { spacing: 16 },
        header: {
            labelFont: PROTON_FONT_BODY,
            titleFont: PROTON_FONT_BODY,
            labelColor: tokens.inkDim,
            titleColor: tokens.ink,
            labelFontSize: 10.5,
            titleFontSize: 11,
            titleFontWeight: 600,
        },
    };
}

function visitChartNodes(spec: Record<string, unknown>, visit: (node: Record<string, unknown>) => void): void {
    visit(spec);

    for (const key of ['vconcat', 'hconcat', 'concat', 'layer'] as const) {
        const children = spec[key];
        if (!Array.isArray(children)) {
            continue;
        }

        for (const child of children) {
            if (child && typeof child === 'object' && !Array.isArray(child)) {
                visitChartNodes(child as Record<string, unknown>, visit);
            }
        }
    }

    const nestedSpec = spec.spec;
    if (nestedSpec && typeof nestedSpec === 'object' && !Array.isArray(nestedSpec)) {
        visitChartNodes(nestedSpec as Record<string, unknown>, visit);
    }
}

/** Multi-view roots that must not carry their own unit spec (unlike layer charts). */
function isMultiViewCompositionRoot(node: Record<string, unknown>): boolean {
    return isPanelStack(node) || !!node.facet || !!node.repeat || !!node.spec;
}

function isLayerChart(node: Record<string, unknown>): boolean {
    return Array.isArray(node.layer) && node.layer.length > 0;
}

function hasChartEncoding(encoding: unknown): boolean {
    return !!encoding && typeof encoding === 'object' && !Array.isArray(encoding) && Object.keys(encoding).length > 0;
}

/** Composition roots (vconcat/layer/facet) must not receive a default line mark. */
function shouldApplyProtonMarkColors(node: Record<string, unknown>): boolean {
    if (isLayerChart(node) && !node.mark) {
        return false;
    }

    if (!node.mark && !hasChartEncoding(node.encoding)) {
        return false;
    }

    if (isMultiViewCompositionRoot(node) && !hasChartEncoding(node.encoding)) {
        return false;
    }

    return true;
}

function getMarkType(node: Record<string, unknown>): string | null {
    const mark = node.mark;
    if (typeof mark === 'string') {
        return mark;
    }

    if (mark && typeof mark === 'object' && !Array.isArray(mark)) {
        return String((mark as Record<string, unknown>).type ?? 'line');
    }

    return null;
}

function isUncertaintyMark(node: Record<string, unknown>): boolean {
    const encoding = node.encoding as Record<string, unknown> | undefined;
    if (encoding?.y2) {
        return true;
    }

    if (getMarkType(node) === 'errorband') {
        return true;
    }

    const blob = JSON.stringify({ title: node.title, encoding: node.encoding, transform: node.transform }).toLowerCase();
    return /(confidence|uncertainty|error.?band|\bci\b|stddev|variance|errorbar)/.test(blob);
}

function isProductColorField(field: string): boolean {
    return /^(product|service|app)$/i.test(field);
}

function resolveInlineValues(
    node: Record<string, unknown>,
    root: Record<string, unknown>
): Record<string, unknown>[] | null {
    for (const source of [node, root]) {
        const data = source.data;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            continue;
        }

        const values = (data as Record<string, unknown>).values;
        if (!Array.isArray(values) || values.length === 0) {
            continue;
        }

        return values.filter(
            (row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row)
        );
    }

    return null;
}

function colorFieldValuesUseProtonProducts(
    field: string,
    node: Record<string, unknown>,
    root: Record<string, unknown>
): boolean {
    const rows = resolveInlineValues(node, root);
    if (!rows) {
        return /^product$/i.test(field);
    }

    const productNames = new Set<string>(PROTON_PRODUCT_DOMAIN);
    return rows.some((row) => {
        const value = row[field];
        return typeof value === 'string' && productNames.has(value);
    });
}

function applyColorFieldScale(
    color: Record<string, unknown>,
    node: Record<string, unknown>,
    root: Record<string, unknown>
): void {
    if (applySemanticProductScale(color, node, root)) {
        return;
    }

    const scale =
        color.scale && typeof color.scale === 'object' && !Array.isArray(color.scale)
            ? { ...(color.scale as Record<string, unknown>) }
            : {};

    delete scale.scheme;

    const markType = getMarkType(node);
    const colorType = color.type;
    const useSequentialRamp =
        colorType === 'quantitative' ||
        (markType === 'rect' && colorType !== 'nominal' && colorType !== 'ordinal');

    color.scale = {
        ...scale,
        range: useSequentialRamp ? [...PROTON_SEQUENTIAL_RAMP] : [...PROTON_CATEGORY_COLORS],
    };
}

function applySemanticProductScale(
    colorEncoding: Record<string, unknown>,
    node: Record<string, unknown>,
    root: Record<string, unknown>
): boolean {
    const field = String(colorEncoding.field ?? '');
    if (!isProductColorField(field) || !colorFieldValuesUseProtonProducts(field, node, root)) {
        return false;
    }

    const scale =
        colorEncoding.scale && typeof colorEncoding.scale === 'object' && !Array.isArray(colorEncoding.scale)
            ? (colorEncoding.scale as Record<string, unknown>)
            : {};

    colorEncoding.scale = {
        ...scale,
        domain: [...PROTON_PRODUCT_DOMAIN],
        range: [...PROTON_PRODUCT_COLORS],
    };
    return true;
}

function mergeMark(node: Record<string, unknown>, patch: Record<string, unknown>): void {
    const mark = node.mark;
    if (typeof mark === 'string') {
        node.mark = { type: mark, ...patch };
        return;
    }

    if (mark && typeof mark === 'object' && !Array.isArray(mark)) {
        node.mark = { ...(mark as Record<string, unknown>), ...patch };
        return;
    }

    node.mark = patch;
}

function hasActiveColorEncoding(encoding: Record<string, unknown> | undefined): boolean {
    const color = encoding?.color;
    if (!color || typeof color !== 'object' || Array.isArray(color)) {
        return false;
    }

    const colorObject = color as Record<string, unknown>;
    return 'field' in colorObject || 'condition' in colorObject || typeof colorObject.value === 'string';
}

/**
 * Force Proton role colours onto each chart node (embed config alone is not enough for vconcat specs).
 */
export function applyProtonMarkColors(spec: Record<string, unknown>): void {
    visitChartNodes(spec, (node) => {
        if (!shouldApplyProtonMarkColors(node)) {
            return;
        }

        const encoding = node.encoding as Record<string, unknown> | undefined;
        const colorEncoding = encoding?.color;

        if (colorEncoding && typeof colorEncoding === 'object' && !Array.isArray(colorEncoding) && 'field' in colorEncoding) {
            const color = colorEncoding as Record<string, unknown>;
            if (color.field !== PROTON_STATIC_COLOR_BAND_FIELD) {
                applyColorFieldScale(color, node, spec);
            }
        } else if (colorEncoding && typeof colorEncoding === 'object' && !Array.isArray(colorEncoding)) {
            const color = colorEncoding as Record<string, unknown>;
            const condition = color.condition;
            if (condition && typeof condition === 'object' && !Array.isArray(condition) && 'field' in condition) {
                applyColorFieldScale(condition as Record<string, unknown>, node, spec);
            }
        }

        if (hasActiveColorEncoding(encoding)) {
            const markType = getMarkType(node);
            if (markType === 'bar') {
                mergeMark(node, { type: 'bar', cornerRadiusEnd: 3 });
            }
            return;
        }

        const markType = getMarkType(node);
        if (!markType) {
            return;
        }

        if (markType === 'bar') {
            mergeMark(node, { type: 'bar', color: PROTON_PURPLE, cornerRadiusEnd: 3 });
            return;
        }

        if (markType === 'line' || markType === 'trail') {
            mergeMark(node, { type: markType, color: PROTON_PURPLE, strokeWidth: 2.25, interpolate: 'monotone' });
            return;
        }

        if (markType === 'point' || markType === 'circle') {
            mergeMark(node, { type: markType, color: PROTON_PURPLE, filled: true, opacity: 0.85, strokeWidth: 0 });
            return;
        }

        if (markType === 'area') {
            if (isUncertaintyMark(node)) {
                mergeMark(node, { type: 'area', color: PROTON_INK_FAINT, opacity: 0.35, interpolate: 'monotone' });
            } else {
                mergeMark(node, {
                    type: 'area',
                    color: PROTON_PURPLE,
                    opacity: 0.18,
                    interpolate: 'monotone',
                    line: { color: PROTON_PURPLE, strokeWidth: 2.25 },
                });
            }
            return;
        }

        if (markType === 'arc') {
            mergeMark(node, { type: 'arc', fill: PROTON_PURPLE, padAngle: 0.015, stroke: '#ffffff', strokeWidth: 1.5 });
            return;
        }

        if (markType === 'rect') {
            mergeMark(node, { type: 'rect', fill: PROTON_PURPLE, stroke: '#ffffff', strokeWidth: 0.5 });
        }
    });
}

function mergeAxisDefaults(
    encoding: Record<string, unknown>,
    channel: 'x' | 'y',
    defaults: Record<string, unknown>
): void {
    const channelEncoding = encoding[channel];
    if (!channelEncoding || typeof channelEncoding !== 'object' || Array.isArray(channelEncoding)) {
        return;
    }

    const channelObject = channelEncoding as Record<string, unknown>;
    const existingAxis =
        channelObject.axis && typeof channelObject.axis === 'object' && !Array.isArray(channelObject.axis)
            ? (channelObject.axis as Record<string, unknown>)
            : {};

    const isRightAxis = existingAxis.orient === 'right';

    channelObject.axis = {
        ...defaults,
        ...(isRightAxis ? { grid: false, tickCount: 5 } : {}),
        ...existingAxis,
    };
}

function polishEncodingAxes(encoding: Record<string, unknown>): void {
    mergeAxisDefaults(encoding, 'x', {
        grid: false,
        domain: true,
        labelFontSize: 10,
        titleFontSize: 10,
    });
    mergeAxisDefaults(encoding, 'y', {
        grid: true,
        domain: false,
        labelFontSize: 10,
        titleFontSize: 10,
    });
}

function polishChartTitle(node: Record<string, unknown>): void {
    const topLevelSubtitle = node.subtitle;
    let title = node.title;

    if (title === undefined && topLevelSubtitle === undefined) {
        return;
    }

    if (typeof title === 'string') {
        title = { text: title };
    } else if (!title || typeof title !== 'object' || Array.isArray(title)) {
        title = { text: '' };
    } else {
        title = { ...(title as Record<string, unknown>) };
    }

    const titleObject = title as Record<string, unknown>;

    if (typeof topLevelSubtitle === 'string' && !titleObject.subtitle) {
        titleObject.subtitle = topLevelSubtitle;
    }

    titleObject.anchor ??= 'start';
    titleObject.offset ??= 8;
    titleObject.fontSize ??= 14;
    titleObject.fontWeight ??= 600;

    if (typeof titleObject.subtitle === 'string' && titleObject.subtitle.trim()) {
        titleObject.subtitleFontSize ??= 11.5;
        titleObject.subtitleFontWeight ??= 400;
        titleObject.subtitleLineHeight ??= 16;
        titleObject.subtitlePadding ??= 4;
    }

    node.title = titleObject;
    delete node.subtitle;
}

export function applyProtonChartPolish(spec: Record<string, unknown>): void {
    visitChartNodes(spec, (node) => {
        polishChartTitle(node);

        const encoding = node.encoding;
        if (encoding && typeof encoding === 'object' && !Array.isArray(encoding)) {
            polishEncodingAxes(encoding as Record<string, unknown>);
        }
    });

    polishChartTitle(spec);
}

function isLeafChartNode(node: Record<string, unknown>): boolean {
    return !!node.mark && !!node.encoding && typeof node.encoding === 'object' && !Array.isArray(node.encoding);
}

const DEFAULT_CHART_HEIGHT = 220;
const COMPOSED_PANEL_HEIGHT = 180;

function isPanelStack(spec: Record<string, unknown>): boolean {
    return (
        (Array.isArray(spec.vconcat) && spec.vconcat.length > 0) ||
        (Array.isArray(spec.hconcat) && spec.hconcat.length > 0) ||
        (Array.isArray(spec.concat) && spec.concat.length > 0)
    );
}

function forEachPanelChild(spec: Record<string, unknown>, visit: (child: Record<string, unknown>) => void): void {
    for (const key of ['vconcat', 'hconcat', 'concat'] as const) {
        const children = spec[key];
        if (!Array.isArray(children)) {
            continue;
        }

        for (const child of children) {
            if (child && typeof child === 'object' && !Array.isArray(child)) {
                visit(child as Record<string, unknown>);
            }
        }
    }
}

function stripIncompatibleAutosize(spec: Record<string, unknown>): void {
    const autosize = spec.autosize;
    if (!autosize || typeof autosize !== 'object' || Array.isArray(autosize)) {
        return;
    }

    const autosizeType = (autosize as Record<string, unknown>).type;
    if (autosizeType === 'pad' || autosizeType === 'none') {
        delete spec.autosize;
    }
}

function applyContainerAutosize(spec: Record<string, unknown>): void {
    if (spec.width === 'container') {
        spec.autosize = { type: 'fit-x', contains: 'padding' };
    }
}

/**
 * Charts should fill the Lumo card width. LLM specs often set fixed pixel widths (400–600)
 * which leave large empty gutters inside the card shell.
 *
 * Vega-Lite requires `autosize: fit-x` (not `pad`) when `width` is `container`, and sizing
 * must only live on unit/layer roots or vconcat/hconcat panels — never on layer children.
 */
export function applyResponsiveChartLayout(spec: Record<string, unknown>): void {
    stripIncompatibleAutosize(spec);

    if (isPanelStack(spec)) {
        forEachPanelChild(spec, (child) => {
            child.width = 'container';
            if (child.height === undefined) {
                child.height = COMPOSED_PANEL_HEIGHT;
            }
            stripIncompatibleAutosize(child);
            applyContainerAutosize(child);
        });
        spec.width = 'container';
        delete spec.height;
        stripIncompatibleAutosize(spec);
        applyContainerAutosize(spec);
        return;
    }

    const hasLayer = Array.isArray(spec.layer) && spec.layer.length > 0;
    if (hasLayer || isLeafChartNode(spec)) {
        spec.width = 'container';
        if (spec.height === undefined) {
            spec.height = DEFAULT_CHART_HEIGHT;
        }
        stripIncompatibleAutosize(spec);
        applyContainerAutosize(spec);
        return;
    }

    spec.width = 'container';
    if (spec.height === undefined) {
        spec.height = DEFAULT_CHART_HEIGHT;
    }
    stripIncompatibleAutosize(spec);
    applyContainerAutosize(spec);
}

function isHardcodedColorChannel(value: unknown): boolean {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const channel = value as Record<string, unknown>;
    if ('condition' in channel) {
        return false;
    }

    return typeof channel.value === 'string' && !('field' in channel);
}

function stripScaleOverrides(scale: unknown): void {
    if (!scale || typeof scale !== 'object' || Array.isArray(scale)) {
        return;
    }

    const scaleObject = scale as Record<string, unknown>;
    delete scaleObject.range;
    delete scaleObject.scheme;
}

function stripHardcodedColorsFromEncoding(encoding: Record<string, unknown>): void {
    for (const key of ['color', 'fill', 'stroke', 'fillOpacity', 'strokeOpacity'] as const) {
        if (isHardcodedColorChannel(encoding[key])) {
            delete encoding[key];
        }
    }

    const color = encoding.color;
    if (color && typeof color === 'object' && !Array.isArray(color)) {
        const colorObject = color as Record<string, unknown>;
        if (colorObject.field !== PROTON_STATIC_COLOR_BAND_FIELD) {
            stripScaleOverrides(colorObject.scale);
        }

        const condition = colorObject.condition;
        if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
            stripScaleOverrides((condition as Record<string, unknown>).scale);
        }
    }
}

function stripHardcodedColorsFromMark(mark: unknown): void {
    if (!mark || typeof mark !== 'object' || Array.isArray(mark)) {
        return;
    }

    const markObject = mark as Record<string, unknown>;
    for (const key of ['color', 'fill', 'stroke'] as const) {
        if (typeof markObject[key] === 'string') {
            delete markObject[key];
        }
    }
}

function stripHardcodedColorsFromNode(node: Record<string, unknown>): void {
    const encoding = node.encoding;
    if (encoding && typeof encoding === 'object' && !Array.isArray(encoding)) {
        stripHardcodedColorsFromEncoding(encoding as Record<string, unknown>);
    }

    stripHardcodedColorsFromMark(node.mark);
}

export function stripHardcodedChartColors(spec: Record<string, unknown>): void {
    visitChartNodes(spec, stripHardcodedColorsFromNode);

    const specConfig = spec.config;
    if (specConfig && typeof specConfig === 'object' && !Array.isArray(specConfig)) {
        const config = specConfig as Record<string, unknown>;
        for (const key of [
            'range',
            'mark',
            'axis',
            'axisX',
            'axisY',
            'title',
            'legend',
            'background',
            'line',
            'bar',
            'area',
            'point',
            'arc',
            'rect',
            'circle',
            'boxplot',
            'errorband',
        ]) {
            delete config[key];
        }
    }
}

/** Removes orphan marks on multi-view composition roots — invalid and causes blank renders. */
export function stripStrayCompositionMarkEncoding(spec: Record<string, unknown>): void {
    visitChartNodes(spec, (node) => {
        if (isLayerChart(node)) {
            return;
        }

        if (!isMultiViewCompositionRoot(node)) {
            return;
        }

        if (node.mark && !hasChartEncoding(node.encoding)) {
            delete node.mark;
        }

        if (!node.mark && hasChartEncoding(node.encoding)) {
            delete node.encoding;
        }
    });
}
