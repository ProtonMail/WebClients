import {
    PROTON_DRIVE_RED,
    PROTON_PURPLE,
    PROTON_STATIC_COLOR_BAND_FIELD,
} from './protonChartTokens';

const VEGA_LITE_V5_SCHEMA = 'https://vega.github.io/schema/vega-lite/v5.json';

const DATUM_TEST_PATTERN = /datum\.(\w+)\s*(>=|>|<=|<|==)\s*(-?\d+(?:\.\d+)?)/;
const METRIC_FILTER_PATTERN = /datum\.metric\s*(===|!==)\s*['"]([^'"]+)['"]/;

const X_FIELD_CANDIDATES = ['month', 'date', 'day', 'time', 'week', 'year', 'category', 'name', 'label', 'x'];

const SERIES_EXCLUDE_PATTERN = /precip|rain|snow|month_num|^id$|index|_id$/i;

/** Top-level keys from full Vega specs that Vega-Lite cannot compile. */
const FULL_VEGA_TOP_LEVEL_KEYS = ['marks', 'signals', 'scales', 'axes', 'layout'] as const;

type FieldType = 'quantitative' | 'ordinal' | 'nominal' | 'temporal';

function hasValidEncoding(encoding: unknown): boolean {
    if (!encoding || typeof encoding !== 'object' || Array.isArray(encoding)) {
        return false;
    }

    return Object.keys(encoding as Record<string, unknown>).length > 0;
}

function isNonEmptyArray(value: unknown): value is unknown[] {
    return Array.isArray(value) && value.length > 0;
}

/** A bare `mark` without `encoding` is incomplete — LLMs often emit one without the other. */
function isVegaLiteChartDefinition(spec: Record<string, unknown>): boolean {
    if (isNonEmptyArray(spec.vconcat) || isNonEmptyArray(spec.hconcat) || isNonEmptyArray(spec.concat)) {
        return true;
    }

    if (isNonEmptyArray(spec.layer)) {
        return true;
    }

    if (spec.facet || spec.repeat || spec.spec) {
        return true;
    }

    return !!(spec.mark && hasValidEncoding(spec.encoding));
}

function stripFullVegaKeys(spec: Record<string, unknown>): void {
    for (const key of FULL_VEGA_TOP_LEVEL_KEYS) {
        delete spec[key];
    }
}

function extractInlineValues(spec: Record<string, unknown>): Record<string, unknown>[] | null {
    const data = spec.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return null;
    }

    const values = (data as Record<string, unknown>).values;
    if (!Array.isArray(values) || values.length === 0) {
        return null;
    }

    return values.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row));
}

function inferXField(keys: string[], sample: Record<string, unknown>): string {
    const lowerKeyMap = new Map(keys.map((key) => [key.toLowerCase(), key]));
    for (const candidate of X_FIELD_CANDIDATES) {
        const match = lowerKeyMap.get(candidate);
        if (match) {
            return match;
        }
    }

    const stringField = keys.find((key) => typeof sample[key] === 'string');
    return stringField ?? keys[0]!;
}

function inferXType(field: string, sample: Record<string, unknown>): FieldType {
    const value = sample[field];
    if (typeof value === 'number') {
        return 'quantitative';
    }

    const lowerField = field.toLowerCase();
    if (/(date|time|year)/.test(lowerField)) {
        return 'temporal';
    }

    if (/(month|day|week|quarter)/.test(lowerField)) {
        return 'ordinal';
    }

    return 'nominal';
}

function getYFieldTitle(layer: Record<string, unknown>): string | undefined {
    const encoding = layer.encoding as Record<string, unknown> | undefined;
    const y = encoding?.y as Record<string, unknown> | undefined;
    if (!y) {
        return undefined;
    }

    if (typeof y.title === 'string') {
        return y.title;
    }

    if (typeof y.field === 'string') {
        return y.field.replace(/_/g, ' ');
    }

    return undefined;
}

function getMarkTypeFromNode(node: Record<string, unknown>): string | null {
    const mark = node.mark;
    if (typeof mark === 'string') {
        return mark;
    }

    if (mark && typeof mark === 'object' && !Array.isArray(mark)) {
        const type = (mark as Record<string, unknown>).type;
        return typeof type === 'string' ? type : null;
    }

    return null;
}

function getPolarEncodings(encoding: Record<string, unknown>): Record<string, unknown> {
    const shared: Record<string, unknown> = {};
    for (const key of ['theta', 'color', 'order', 'radius'] as const) {
        if (encoding[key] !== undefined) {
            shared[key] = encoding[key];
        }
    }

    return shared;
}

/**
 * LLMs often emit a unit chart (mark + encoding) alongside a `layer` array for labels.
 * Vega-Lite then ignores the root unit and only compiles the layer — e.g. donut + text
 * renders blank because the text layer lacks theta.
 */
export function normalizeRootUnitWithLayer(spec: Record<string, unknown>): void {
    const layers = spec.layer;
    if (!Array.isArray(layers) || layers.length === 0) {
        return;
    }

    if (!spec.mark || !hasValidEncoding(spec.encoding)) {
        return;
    }

    const rootEncoding = { ...(spec.encoding as Record<string, unknown>) };
    const polarEncodings = getPolarEncodings(rootEncoding);
    const rootMarkType = getMarkTypeFromNode(spec);

    const normalizedLayers = layers.map((layer) => {
        if (!layer || typeof layer !== 'object' || Array.isArray(layer)) {
            return layer;
        }

        const layerObj = { ...(layer as Record<string, unknown>) };
        const layerEncoding =
            layerObj.encoding && typeof layerObj.encoding === 'object' && !Array.isArray(layerObj.encoding)
                ? { ...(layerObj.encoding as Record<string, unknown>) }
                : {};

        if (Object.keys(polarEncodings).length > 0) {
            const layerMarkType = getMarkTypeFromNode(layerObj);
            if (layerMarkType === 'text' || rootMarkType === 'arc') {
                for (const [key, value] of Object.entries(polarEncodings)) {
                    if (layerEncoding[key] === undefined) {
                        layerEncoding[key] = value;
                    }
                }
            }
        }

        if (Object.keys(layerEncoding).length > 0) {
            layerObj.encoding = layerEncoding;
        }

        return layerObj;
    });

    spec.layer = [
        {
            mark: spec.mark,
            encoding: rootEncoding,
        },
        ...normalizedLayers,
    ];
    delete spec.mark;
    delete spec.encoding;
}

function looksLikeCalendarYear(value: unknown): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1000 && value <= 3000;
}

function layerHasFieldBinding(layer: Record<string, unknown>): boolean {
    const encoding = layer.encoding as Record<string, unknown> | undefined;
    if (!encoding) {
        return false;
    }

    return Object.values(encoding).some(
        (channel) => channel && typeof channel === 'object' && !Array.isArray(channel) && 'field' in (channel as object)
    );
}

function isDecorativeLayer(layer: Record<string, unknown>): boolean {
    return getMarkTypeFromNode(layer) === 'rule' && !layerHasFieldBinding(layer);
}

function layerExpectsMeltedData(layer: Record<string, unknown>): boolean {
    const encoding = layer.encoding as Record<string, unknown> | undefined;
    const y = encoding?.y as Record<string, unknown> | undefined;
    if (y?.field === 'value') {
        return true;
    }

    const transforms = layer.transform;
    if (!Array.isArray(transforms)) {
        return false;
    }

    return transforms.some(
        (transform) =>
            !!transform &&
            typeof transform === 'object' &&
            !Array.isArray(transform) &&
            typeof (transform as Record<string, unknown>).filter === 'string' &&
            ((transform as Record<string, unknown>).filter as string).includes('datum.metric')
    );
}

function seriesFromMetricFilter(filter: string, seriesKeys: string[]): string | null {
    const match = filter.match(METRIC_FILTER_PATTERN);
    if (!match) {
        return null;
    }

    const [, operator, metricName] = match;
    if (operator === '===') {
        return seriesKeys.includes(metricName!) ? metricName! : null;
    }

    return seriesKeys.find((key) => key !== metricName) ?? null;
}

/**
 * LLMs often emit dual-axis layer specs that filter on `datum.metric` and plot `value`
 * without folding wide data first. Map each layer to the matching numeric column instead.
 */
export function normalizeWideDataLayerCharts(spec: Record<string, unknown>): void {
    const layers = spec.layer;
    if (!Array.isArray(layers)) {
        return;
    }

    const values = extractInlineValues(spec);
    if (!values) {
        return;
    }

    const sample = values[0]!;
    const keys = Object.keys(sample);
    const xField = inferXField(keys, sample);
    const seriesKeys = keys.filter((key) => key !== xField && typeof sample[key] === 'number');
    if (seriesKeys.length < 1 || 'value' in sample || 'metric' in sample) {
        return;
    }

    const dataLayers = layers.filter(
        (layer): layer is Record<string, unknown> =>
            !!layer && typeof layer === 'object' && !Array.isArray(layer) && !isDecorativeLayer(layer)
    );
    if (!dataLayers.some(layerExpectsMeltedData)) {
        return;
    }

    let dataLayerIndex = 0;
    spec.layer = layers.map((layer) => {
        if (!layer || typeof layer !== 'object' || Array.isArray(layer) || isDecorativeLayer(layer)) {
            return layer;
        }

        const layerObj = { ...(layer as Record<string, unknown>) };
        if (!layerExpectsMeltedData(layerObj)) {
            return layerObj;
        }

        let seriesField: string | null = null;
        const transforms = layerObj.transform;
        if (Array.isArray(transforms)) {
            for (const transform of transforms) {
                if (!transform || typeof transform !== 'object' || Array.isArray(transform)) {
                    continue;
                }

                const filter = (transform as Record<string, unknown>).filter;
                if (typeof filter === 'string') {
                    seriesField = seriesFromMetricFilter(filter, seriesKeys);
                    if (seriesField) {
                        break;
                    }
                }
            }
        }

        if (!seriesField) {
            seriesField = seriesKeys[dataLayerIndex] ?? null;
        }
        dataLayerIndex += 1;

        if (!seriesField) {
            return layerObj;
        }

        delete layerObj.transform;

        const encoding = { ...(layerObj.encoding as Record<string, unknown>) };
        const y = { ...(encoding.y as Record<string, unknown>) };
        y.field = seriesField;
        encoding.y = y;
        layerObj.encoding = encoding;

        return layerObj;
    });
}

/** Numeric calendar years encoded as temporal collapse to a single x tick — use ordinal instead. */
export function normalizeYearAxisEncoding(spec: Record<string, unknown>): void {
    const rootValues = extractInlineValues(spec);

    visitChartNodesForNormalize(spec, (node) => {
        const values = extractInlineValues(node) ?? rootValues;
        const encoding = node.encoding as Record<string, unknown> | undefined;
        const x = encoding?.x as Record<string, unknown> | undefined;
        if (!values || !x || typeof x.field !== 'string' || x.type !== 'temporal') {
            return;
        }

        const field = x.field;
        if (!values.every((row) => looksLikeCalendarYear(row[field]))) {
            return;
        }

        x.type = 'ordinal';
        if (x.axis && typeof x.axis === 'object' && !Array.isArray(x.axis)) {
            const axis = { ...(x.axis as Record<string, unknown>) };
            delete axis.format;
            x.axis = axis;
        }
    });
}

function flattenYAxis(layer: Record<string, unknown>): void {
    const encoding = layer.encoding as Record<string, unknown> | undefined;
    const y = encoding?.y as Record<string, unknown> | undefined;
    if (!y || typeof y !== 'object') {
        return;
    }

    const axis = y.axis;
    if (!axis || typeof axis !== 'object' || Array.isArray(axis)) {
        return;
    }

    const nextAxis = { ...(axis as Record<string, unknown>) };
    delete nextAxis.orient;
    y.axis = nextAxis;
}

function buildSubchart(
    layer: Record<string, unknown>,
    data: unknown,
    index: number,
    total: number,
    xEncoding: Record<string, unknown>
): Record<string, unknown> {
    const flattened = { ...layer };
    flattenYAxis(flattened);

    const encoding = { ...(flattened.encoding as Record<string, unknown>) };
    const isLast = index === total - 1;
    encoding.x = {
        ...xEncoding,
        axis: isLast
            ? { ...(xEncoding.axis as Record<string, unknown> | undefined), title: xEncoding.title ?? null }
            : { labels: false, ticks: false, title: null, grid: false, domain: false },
    };
    flattened.encoding = encoding;

    return {
        data,
        width: 'container',
        height: 130,
        title: { text: getYFieldTitle(flattened) ?? `Series ${index + 1}`, fontSize: 12, anchor: 'start' },
        ...flattened,
    };
}

/**
 * Split dual-axis layered specs into vertically stacked single-axis charts.
 */
export function splitDualAxisCharts(spec: Record<string, unknown>): Record<string, unknown> {
    const layers = spec.layer;
    if (!Array.isArray(layers) || layers.length < 2) {
        return spec;
    }

    const dataLayers = layers.filter(
        (layer): layer is Record<string, unknown> =>
            !!layer && typeof layer === 'object' && !Array.isArray(layer) && !isDecorativeLayer(layer)
    );
    if (dataLayers.length < 2) {
        return spec;
    }

    const resolve = spec.resolve as Record<string, unknown> | undefined;
    const scaleResolve = resolve?.scale as Record<string, unknown> | undefined;
    const independentY = scaleResolve?.y === 'independent';

    const hasSecondaryAxis = dataLayers.some((layer) => {
        const y = layer.encoding as Record<string, unknown> | undefined;
        const yEnc = y?.y as Record<string, unknown> | undefined;
        const axis = yEnc?.axis as Record<string, unknown> | undefined;
        return axis?.orient === 'right';
    });

    if (!independentY && !hasSecondaryAxis) {
        return spec;
    }

    const data = spec.data;
    const firstLayer = dataLayers[0]!;
    const xEncoding = (firstLayer.encoding as Record<string, unknown> | undefined)?.x as
        | Record<string, unknown>
        | undefined;

    if (!xEncoding) {
        return spec;
    }

    const subcharts = dataLayers.map((layer, index) =>
        buildSubchart(layer, data, index, dataLayers.length, xEncoding)
    );

    return {
        $schema: spec.$schema ?? VEGA_LITE_V5_SCHEMA,
        title: spec.title,
        data,
        width: spec.width ?? 'container',
        vconcat: subcharts,
        spacing: 12,
    };
}

function inferChartFromValues(values: Record<string, unknown>[]): Record<string, unknown> {
    const sample = values[0]!;
    const keys = Object.keys(sample);
    const xField = inferXField(keys, sample);
    const xType = inferXType(xField, sample);
    const numericKeys = keys.filter((key) => key !== xField && typeof sample[key] === 'number');
    const precipKeys = numericKeys.filter((key) => /precip|rain|snow/i.test(key));
    const seriesKeys = numericKeys.filter((key) => !SERIES_EXCLUDE_PATTERN.test(key));

    const xEncoding = { field: xField, type: xType, title: xField.replace(/_/g, ' ') };
    const data = { values };

    const subcharts: Record<string, unknown>[] = [];

    for (const precipKey of precipKeys) {
        subcharts.push({
            mark: { type: 'bar', cornerRadiusEnd: 3 },
            encoding: {
                x: xEncoding,
                y: {
                    field: precipKey,
                    type: 'quantitative',
                    title: precipKey.replace(/_/g, ' '),
                },
            },
        });
    }

    if (seriesKeys.length === 1) {
        subcharts.push({
            mark: 'line',
            encoding: {
                x: xEncoding,
                y: {
                    field: seriesKeys[0],
                    type: 'quantitative',
                    title: seriesKeys[0]!.replace(/_/g, ' '),
                },
            },
        });
    } else if (seriesKeys.length > 1) {
        subcharts.push({
            transform: [{ fold: seriesKeys, as: ['series', 'value'] }],
            mark: 'line',
            encoding: {
                x: xEncoding,
                y: { field: 'value', type: 'quantitative', title: 'Value' },
                color: { field: 'series', type: 'nominal', title: 'Series' },
            },
        });
    }

    if (subcharts.length === 0) {
        return {
            mark: 'bar',
            encoding: {
                x: xEncoding,
                y: { field: numericKeys[0], type: 'quantitative', title: String(numericKeys[0]).replace(/_/g, ' ') },
            },
        };
    }

    if (subcharts.length === 1) {
        return { ...subcharts[0]!, data };
    }

    return {
        data,
        width: 'container',
        vconcat: subcharts.map((chart, index) =>
            buildSubchart({ ...chart, data }, data, index, subcharts.length, xEncoding)
        ),
        spacing: 12,
    };
}

function normalizeTitle(spec: Record<string, unknown>): void {
    const title = spec.title;
    const subtitle = spec.subtitle;

    if (typeof subtitle === 'string') {
        if (typeof title === 'string') {
            spec.title = { text: title, subtitle };
        } else if (title && typeof title === 'object' && !Array.isArray(title)) {
            (title as Record<string, unknown>).subtitle ??= subtitle;
        } else {
            spec.title = { text: '', subtitle };
        }

        delete spec.subtitle;
        return;
    }

    if (typeof title === 'string') {
        spec.title = { text: title, anchor: 'start' };
    }
}

/**
 * Repairs common LLM Vega-Lite output so vega-embed can compile it:
 * - normalizes $schema to Vega-Lite v5
 * - moves subtitle into title
 * - infers mark/encoding from inline data.values when missing
 * - hoists root mark/encoding into layer when LLMs mix unit specs with label layers
 * - splits dual-axis layers into vconcat stacks
 */
export function normalizeVegaLiteSpec(spec: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = { ...spec, $schema: VEGA_LITE_V5_SCHEMA };

    normalizeTitle(normalized);
    stripFullVegaKeys(normalized);
    normalizeRootUnitWithLayer(normalized);
    normalizeWideDataLayerCharts(normalized);

    const result = splitDualAxisCharts(
        isVegaLiteChartDefinition(normalized)
            ? normalized
            : (() => {
                  const values = extractInlineValues(normalized);
                  if (!values) {
                      return normalized;
                  }

                  delete normalized.mark;
                  delete normalized.encoding;

                  return {
                      ...normalized,
                      ...inferChartFromValues(values),
                  };
              })()
    );

    normalizeSelectionFilters(result);
    normalizeMisusedHeatmaps(result);
    normalizeYearAxisEncoding(result);
    repairInteractiveSpec(result);
    return result;
}

function isDiscreteFieldType(type: unknown): boolean {
    return type === 'ordinal' || type === 'nominal';
}

/**
 * LLMs often emit 1D "heatmaps" (rect + rainbow scheme + hour on both axes).
 * Convert to bar charts unless both x and y are discrete categories (true 2D heatmap).
 */
export function normalizeMisusedHeatmaps(spec: Record<string, unknown>): void {
    visitChartNodesForNormalize(spec, (node) => {
        const mark = node.mark;
        const markType = typeof mark === 'string' ? mark : (mark as Record<string, unknown> | undefined)?.type;
        if (markType !== 'rect') {
            return;
        }

        const encoding = node.encoding as Record<string, unknown> | undefined;
        if (!encoding) {
            return;
        }

        const x = encoding.x as Record<string, unknown> | undefined;
        const y = encoding.y as Record<string, unknown> | undefined;
        const color = encoding.color as Record<string, unknown> | undefined;

        if (x && isDiscreteFieldType(x.type) && y && isDiscreteFieldType(y.type)) {
            return;
        }

        const valueField =
            (color && typeof color.field === 'string' ? color.field : undefined) ??
            (y && typeof y.field === 'string' && y.type === 'quantitative' ? y.field : undefined);

        if (!valueField || !x) {
            return;
        }

        node.mark = { type: 'bar', cornerRadiusEnd: 3 };
        node.encoding = {
            x,
            y: {
                field: valueField,
                type: 'quantitative',
                title:
                    (color?.title as string | undefined) ??
                    (y?.title as string | undefined) ??
                    String(valueField).replace(/_/g, ' '),
            },
        };
    });
}

interface VegaParamDefinition {
    name: string;
    [key: string]: unknown;
}

function getCompositionChildren(spec: Record<string, unknown>): Record<string, unknown>[] | null {
    for (const key of ['vconcat', 'hconcat', 'concat'] as const) {
        const children = spec[key];
        if (Array.isArray(children) && children.length > 0) {
            return children.filter(
                (child): child is Record<string, unknown> => !!child && typeof child === 'object' && !Array.isArray(child)
            );
        }
    }

    return null;
}

function collectParamDefinitions(spec: Record<string, unknown>): VegaParamDefinition[] {
    const params: VegaParamDefinition[] = [];

    visitChartNodesForNormalize(spec, (node) => {
        const nodeParams = node.params;
        if (!Array.isArray(nodeParams)) {
            return;
        }

        for (const param of nodeParams) {
            if (param && typeof param === 'object' && !Array.isArray(param) && typeof param.name === 'string') {
                params.push(param as VegaParamDefinition);
            }
        }
    });

    return params;
}

function collectParamNames(spec: Record<string, unknown>): Set<string> {
    return new Set(collectParamDefinitions(spec).map((param) => param.name));
}

/**
 * Selection params defined on a vconcat/hconcat child are not visible to sibling panels.
 * Hoist them to the composition root so linked filters and conditions resolve.
 */
export function hoistCompositionParams(spec: Record<string, unknown>): void {
    for (const key of ['vconcat', 'hconcat', 'concat'] as const) {
        const children = spec[key];
        if (!Array.isArray(children) || children.length === 0) {
            continue;
        }

        const rootParams = Array.isArray(spec.params) ? [...spec.params] : [];
        const seen = new Set(
            rootParams
                .filter((param): param is VegaParamDefinition => !!param && typeof param === 'object' && !Array.isArray(param))
                .map((param) => param.name)
        );

        for (const child of children) {
            if (!child || typeof child !== 'object' || Array.isArray(child)) {
                continue;
            }

            const childNode = child as Record<string, unknown>;
            const childParams = childNode.params;
            if (!Array.isArray(childParams)) {
                continue;
            }

            for (const param of childParams) {
                if (!param || typeof param !== 'object' || Array.isArray(param) || typeof param.name !== 'string') {
                    continue;
                }

                if (!seen.has(param.name)) {
                    rootParams.push(param as VegaParamDefinition);
                    seen.add(param.name);
                }
            }

            delete childNode.params;
        }

        if (rootParams.length > 0) {
            spec.params = rootParams;
        }
    }
}

function staticizeParamColorCondition(color: Record<string, unknown>): void {
    const condition = color.condition;
    if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
        delete color.condition;
        delete color.value;
        return;
    }

    const conditionObject = condition as Record<string, unknown>;
    if (typeof conditionObject.field === 'string') {
        const nextColor: Record<string, unknown> = {
            field: conditionObject.field,
            type: conditionObject.type ?? 'nominal',
        };

        if (typeof conditionObject.title === 'string') {
            nextColor.title = conditionObject.title;
        }

        for (const key of Object.keys(color)) {
            delete color[key];
        }
        Object.assign(color, nextColor);
        return;
    }

    delete color.condition;
    delete color.value;
}

function stripParamTransforms(node: Record<string, unknown>, definedParams: Set<string>): void {
    const transforms = node.transform;
    if (!Array.isArray(transforms)) {
        return;
    }

    node.transform = transforms.filter((transform) => {
        if (!transform || typeof transform !== 'object' || Array.isArray(transform)) {
            return true;
        }

        const filter = (transform as Record<string, unknown>).filter;
        if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
            return true;
        }

        const paramName = (filter as Record<string, unknown>).param;
        return typeof paramName !== 'string' || definedParams.has(paramName);
    });

    if (Array.isArray(node.transform) && node.transform.length === 0) {
        delete node.transform;
    }
}

function stripInvalidInteractiveReferences(spec: Record<string, unknown>, definedParams: Set<string>): void {
    visitChartNodesForNormalize(spec, (node) => {
        stripParamTransforms(node, definedParams);

        const encoding = node.encoding;
        if (!encoding || typeof encoding !== 'object' || Array.isArray(encoding)) {
            return;
        }

        const color = (encoding as Record<string, unknown>).color;
        if (!color || typeof color !== 'object' || Array.isArray(color)) {
            return;
        }

        const colorObject = color as Record<string, unknown>;
        const condition = colorObject.condition;
        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
            return;
        }

        const paramName = (condition as Record<string, unknown>).param;
        if (typeof paramName === 'string' && !definedParams.has(paramName)) {
            staticizeParamColorCondition(colorObject);
        }
    });
}

function stripAllInteractiveFeatures(spec: Record<string, unknown>): void {
    delete spec.params;

    visitChartNodesForNormalize(spec, (node) => {
        delete node.params;
        stripParamTransforms(node, new Set());

        const encoding = node.encoding;
        if (!encoding || typeof encoding !== 'object' || Array.isArray(encoding)) {
            return;
        }

        const color = (encoding as Record<string, unknown>).color;
        if (!color || typeof color !== 'object' || Array.isArray(color)) {
            return;
        }

        const colorObject = color as Record<string, unknown>;
        if (
            colorObject.condition &&
            typeof colorObject.condition === 'object' &&
            !Array.isArray(colorObject.condition) &&
            'param' in (colorObject.condition as Record<string, unknown>)
        ) {
            staticizeParamColorCondition(colorObject);
        }
    });
}

/**
 * LLM specs often sprinkle selection params onto static multi-panel charts after the
 * interactivity prompt — child-scoped params, orphan filters, and grayed-out conditions
 * compile cleanly but render blank panels.
 */
export function repairInteractiveSpec(spec: Record<string, unknown>): void {
    hoistCompositionParams(spec);

    const compositionChildren = getCompositionChildren(spec);
    if (compositionChildren && compositionChildren.length >= 3) {
        stripAllInteractiveFeatures(spec);
        return;
    }

    let definedParams = collectParamNames(spec);
    stripInvalidInteractiveReferences(spec, definedParams);

    if (definedParams.size === 0) {
        return;
    }

    definedParams = collectParamNames(spec);

    if (compositionChildren && compositionChildren.length === 2) {
        return;
    }

    // Single-panel specs with leftover selection params are almost always accidental.
    stripAllInteractiveFeatures(spec);
}

function passesDatumThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
        case '>':
            return value > threshold;
        case '>=':
            return value >= threshold;
        case '<':
            return value < threshold;
        case '<=':
            return value <= threshold;
        case '==':
            return value === threshold;
        default:
            return false;
    }
}

/**
 * LLMs often highlight bars with `color.condition.test` expressions like `datum.error_rate > 0.8`.
 * Lumo renders with the sandboxed Vega expression interpreter, which cannot evaluate those predicates —
 * the chart compiles but renders blank. Pre-compute a nominal band field from inline data instead.
 */
export function normalizeTestBasedColorEncoding(spec: Record<string, unknown>): void {
    visitChartNodesForNormalize(spec, (node) => {
        const encoding = node.encoding as Record<string, unknown> | undefined;
        const color = encoding?.color;
        if (!color || typeof color !== 'object' || Array.isArray(color)) {
            return;
        }

        const colorObject = color as Record<string, unknown>;
        const condition = colorObject.condition;
        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
            return;
        }

        const conditionObject = condition as Record<string, unknown>;
        if (typeof conditionObject.param === 'string') {
            return;
        }

        const test = conditionObject.test;
        if (typeof test !== 'string') {
            return;
        }

        const match = test.match(DATUM_TEST_PATTERN);
        if (!match) {
            delete encoding!.color;
            return;
        }

        const [, field, operator, rawThreshold] = match;
        const threshold = Number(rawThreshold);
        const values = extractInlineValues(node);
        if (!values) {
            delete encoding!.color;
            return;
        }

        const highlightValue =
            typeof conditionObject.value === 'string' ? conditionObject.value : PROTON_DRIVE_RED;
        const defaultValue = typeof colorObject.value === 'string' ? colorObject.value : PROTON_PURPLE;

        for (const row of values) {
            const rawValue = row[field!];
            if (typeof rawValue !== 'number') {
                row[PROTON_STATIC_COLOR_BAND_FIELD] = 'default';
                continue;
            }

            row[PROTON_STATIC_COLOR_BAND_FIELD] = passesDatumThreshold(rawValue, operator!, threshold)
                ? 'highlight'
                : 'default';
        }

        encoding!.color = {
            field: PROTON_STATIC_COLOR_BAND_FIELD,
            type: 'nominal',
            legend: null,
            scale: {
                domain: ['default', 'highlight'],
                range: [defaultValue, highlightValue],
            },
        };

        const mark = node.mark;
        if (mark && typeof mark === 'object' && !Array.isArray(mark)) {
            delete (mark as Record<string, unknown>).color;
            delete (mark as Record<string, unknown>).fill;
        }
    });
}

/** d3 `%` formats multiply by 100 — wrong when data is already stored as 29 meaning 29%. */
function usesPercentMultiplierFormat(format: unknown): boolean {
    if (typeof format !== 'string' || !format) {
        return false;
    }

    if (format.includes('%%')) {
        return false;
    }

    return format === '%' || /\.?\d*%$/.test(format);
}

function numericValuesForField(node: Record<string, unknown>, field: string): number[] {
    const values = extractInlineValues(node);
    if (!values) {
        return [];
    }

    return values
        .map((row) => row[field])
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

function valuesAreUnitFractions(values: number[]): boolean {
    if (values.length === 0) {
        return false;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max > 1 || min < 0) {
        return false;
    }

    const sum = values.reduce((total, value) => total + value, 0);
    return sum > 0.95 && sum < 1.05;
}

function valuesAreStoredAsPercentPoints(values: number[]): boolean {
    if (values.length === 0) {
        return false;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    if (min < 0 || max > 100) {
        return false;
    }

    if (max <= 1) {
        const sum = values.reduce((total, value) => total + value, 0);
        if (sum <= 1.05) {
            return false;
        }

        return true;
    }

    return true;
}

function decimalFormatForPercentValues(values: number[]): string {
    const max = Math.max(...values);
    if (max <= 1.5) {
        return '.1f';
    }

    return max >= 10 ? '.0f' : '.1f';
}

function ensurePercentLabel(channel: Record<string, unknown>, field: string): void {
    const title = channel.title;
    if (typeof title === 'string' && title.includes('%')) {
        return;
    }

    if (typeof title === 'string' && title.trim()) {
        channel.title = `${title.trim()} (%)`;
        return;
    }

    const label = field.replace(/_/g, ' ');
    channel.title = `${label.charAt(0).toUpperCase()}${label.slice(1)} (%)`;
}

function fixChannelPercentFormat(channel: Record<string, unknown>, field: string, values: number[]): void {
    if (!usesPercentMultiplierFormat(channel.format)) {
        return;
    }

    if (valuesAreUnitFractions(values)) {
        return;
    }

    if (!valuesAreStoredAsPercentPoints(values)) {
        return;
    }

    channel.format = decimalFormatForPercentValues(values);
    ensurePercentLabel(channel, field);

    const axis = channel.axis;
    if (axis && typeof axis === 'object' && !Array.isArray(axis)) {
        const axisObject = axis as Record<string, unknown>;
        if (usesPercentMultiplierFormat(axisObject.format)) {
            axisObject.format = channel.format;
        }
    }
}

function visitEncodingFormatChannels(
    node: Record<string, unknown>,
    visit: (channel: Record<string, unknown>, field: string) => void
): void {
    const encoding = node.encoding;
    if (!encoding || typeof encoding !== 'object' || Array.isArray(encoding)) {
        return;
    }

    for (const value of Object.values(encoding as Record<string, unknown>)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const channel = item as Record<string, unknown>;
                    if (typeof channel.field === 'string') {
                        visit(channel, channel.field);
                    }
                }
            }
            continue;
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            continue;
        }

        const channel = value as Record<string, unknown>;
        if (typeof channel.field === 'string') {
            visit(channel, channel.field);
        }
    }
}

/**
 * LLMs often store percentages as 29 / 0.4 but format with d3 `%`, which expects 0.29 / 0.004
 * and displays 2900% or 40%. Rewrite to fixed-decimal formats when inline data shows percent points.
 */
export function normalizeStoredPercentFormats(spec: Record<string, unknown>): void {
    visitChartNodesForNormalize(spec, (node) => {
        visitEncodingFormatChannels(node, (channel, field) => {
            fixChannelPercentFormat(channel, field, numericValuesForField(node, field));
        });
    });
}

function visitChartNodesForNormalize(
    spec: Record<string, unknown>,
    visit: (node: Record<string, unknown>) => void
): void {
    visit(spec);

    for (const key of ['vconcat', 'hconcat', 'concat', 'layer'] as const) {
        const children = spec[key];
        if (!Array.isArray(children)) {
            continue;
        }

        for (const child of children) {
            if (child && typeof child === 'object' && !Array.isArray(child)) {
                visitChartNodesForNormalize(child as Record<string, unknown>, visit);
            }
        }
    }

    const nestedSpec = spec.spec;
    if (nestedSpec && typeof nestedSpec === 'object' && !Array.isArray(nestedSpec)) {
        visitChartNodesForNormalize(nestedSpec as Record<string, unknown>, visit);
    }
}

/**
 * Param-driven data filters hide all marks when the selection is empty unless `empty: true`.
 * LLM specs often omit that flag, which produces blank charts with no compile error.
 */
export function normalizeSelectionFilters(spec: Record<string, unknown>): void {
    visitChartNodesForNormalize(spec, (node) => {
        const transforms = node.transform;
        if (!Array.isArray(transforms)) {
            return;
        }

        for (const transform of transforms) {
            if (!transform || typeof transform !== 'object' || Array.isArray(transform)) {
                continue;
            }

            const filter = (transform as Record<string, unknown>).filter;
            if (!filter || typeof filter !== 'object' || Array.isArray(filter)) {
                continue;
            }

            const paramFilter = filter as Record<string, unknown>;
            if (typeof paramFilter.param === 'string' && paramFilter.empty !== true) {
                paramFilter.empty = true;
            }
        }
    });
}
