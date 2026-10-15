import { repairJson } from './repairJson';

/**
 * The slide deck the model writes: JSON describing slides by layout, never markup or code. Anything
 * the renderer can't use is reported as an issue, not dropped silently (see `artifact-slides-audit.md`).
 */

export const DECK_VERSION = 1;

/** Charts are capped at the first four Proton categorical colours, which pass the dataviz palette checks on white. */
export const MAX_CHART_SERIES = 4;

const LONG_BULLET_WORDS = 25;
const LONG_TITLE_WORDS = 12;
const MAX_PIE_SLICES = 6;

export type ChartKind = 'bar' | 'line' | 'pie';

export interface ChartSeries {
    name: string;
    values: number[];
}

export interface ChartData {
    kind: ChartKind;
    categories: string[];
    series: ChartSeries[];
    /** Shown as the value axis title, e.g. "%" or "€ millions". */
    unit?: string;
    /** Where the numbers come from, e.g. "User's table: revenue by region". */
    source?: string;
}

/** The model had no data for a chart it wanted: rendered as a visible "Data needed" box, never invented. */
export interface MissingChart {
    missing: string;
}

export interface TitleSlide {
    layout: 'title';
    title: string;
    subtitle?: string;
    notes?: string;
}

export interface BulletItem {
    text: string;
    level: 1 | 2;
}

export interface BulletsSlide {
    layout: 'bullets';
    title: string;
    bullets: BulletItem[];
    notes?: string;
}

export interface ChartSlide {
    layout: 'chart';
    title: string;
    chart: ChartData | MissingChart;
    takeaway?: string;
    notes?: string;
}

export type Slide = TitleSlide | BulletsSlide | ChartSlide;

/** A number the model computed from the user's material, and how. */
export interface CalculatedNumber {
    value: string;
    how: string;
}

export interface Deck {
    version: typeof DECK_VERSION;
    title: string;
    slides: Slide[];
    /** Information the model said it was missing, deck-wide. */
    gaps: string[];
    calculated: CalculatedNumber[];
}

export interface DeckIssue {
    severity: 'error' | 'warning';
    /** JSON path into the model output, e.g. `slides[2].chart.series[0].values[3]`. */
    path: string;
    message: string;
}

export interface ParsedDeck {
    deck: Deck | null;
    issues: DeckIssue[];
}

export const isMissingChart = (chart: ChartData | MissingChart): chart is MissingChart => {
    return 'missing' in chart;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/** Collapses whitespace: slide text is laid out line by line, so stray newlines and tabs would break measuring. */
const cleanText = (value: unknown): string => {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
};

const optionalText = (value: unknown): string | undefined => {
    const text = cleanText(value);
    return text || undefined;
};

const countWords = (text: string): number => {
    return text.split(' ').filter(Boolean).length;
};

// Models sometimes send numbers as strings ("1,200", "12.5%"). Only plain forms are accepted; anything
// ambiguous (e.g. "1.200,5") is an error rather than a guess.
const NUMERIC_STRING = /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?%?$/;

const readNumber = (value: unknown): number | null => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && NUMERIC_STRING.test(value.trim())) {
        return Number(value.trim().replace(/[,%]/g, ''));
    }
    return null;
};

const parseBullets = (raw: unknown, path: string, issues: DeckIssue[]): BulletItem[] => {
    if (!Array.isArray(raw)) {
        issues.push({ severity: 'warning', path, message: 'Bullets missing; slide has a title only.' });
        return [];
    }
    const bullets: BulletItem[] = [];
    raw.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const text = isRecord(item) ? cleanText(item.text) : cleanText(item);
        if (!text) {
            issues.push({ severity: 'warning', path: itemPath, message: 'Empty bullet removed.' });
            return;
        }
        let level: 1 | 2 = 1;
        if (isRecord(item) && item.level !== undefined && item.level !== 1) {
            if (item.level !== 2) {
                issues.push({ severity: 'warning', path: itemPath, message: `Level ${item.level} shown as level 2.` });
            }
            // A sub-bullet needs a parent to sit under.
            level = bullets.length > 0 ? 2 : 1;
        }
        if (countWords(text) > LONG_BULLET_WORDS) {
            issues.push({
                severity: 'warning',
                path: itemPath,
                message: `Bullet has more than ${LONG_BULLET_WORDS} words.`,
            });
        }
        bullets.push({ text, level });
    });
    return bullets;
};

const parseChart = (raw: unknown, path: string, issues: DeckIssue[]): ChartData | MissingChart => {
    if (!isRecord(raw)) {
        issues.push({ severity: 'error', path, message: 'Chart missing.' });
        return { missing: 'Chart data' };
    }
    const missing = optionalText(raw.missing);
    if (missing) {
        return { missing };
    }

    const unreadable = (message: string, at = path): MissingChart => {
        issues.push({ severity: 'error', path: at, message });
        return { missing: optionalText(raw.title) ?? 'Chart data' };
    };

    let kind: ChartKind = 'bar';
    if (raw.kind === 'bar' || raw.kind === 'line' || raw.kind === 'pie') {
        kind = raw.kind;
    } else {
        issues.push({
            severity: 'warning',
            path: `${path}.kind`,
            message: `Unknown chart kind "${raw.kind}", drawn as bar.`,
        });
    }

    if (!Array.isArray(raw.categories) || raw.categories.length === 0) {
        return unreadable('Chart has no categories.', `${path}.categories`);
    }
    const categories = raw.categories.map((category) => {
        return typeof category === 'number' ? String(category) : cleanText(category);
    });

    if (!Array.isArray(raw.series) || raw.series.length === 0) {
        return unreadable('Chart has no series.', `${path}.series`);
    }
    const series: ChartSeries[] = [];
    for (let index = 0; index < raw.series.length; index++) {
        const seriesPath = `${path}.series[${index}]`;
        const item = raw.series[index];
        if (!isRecord(item) || !Array.isArray(item.values)) {
            return unreadable('Series has no values.', seriesPath);
        }
        if (item.values.length !== categories.length) {
            return unreadable(
                `Series has ${item.values.length} values for ${categories.length} categories.`,
                `${seriesPath}.values`
            );
        }
        const values: number[] = [];
        for (let valueIndex = 0; valueIndex < item.values.length; valueIndex++) {
            const value = readNumber(item.values[valueIndex]);
            if (value === null) {
                return unreadable(
                    `Value ${JSON.stringify(item.values[valueIndex])} is not a number.`,
                    `${seriesPath}.values[${valueIndex}]`
                );
            }
            if (typeof item.values[valueIndex] === 'string') {
                issues.push({
                    severity: 'warning',
                    path: `${seriesPath}.values[${valueIndex}]`,
                    message: 'Number sent as text.',
                });
            }
            values.push(value);
        }
        series.push({ name: cleanText(item.name) || `Series ${index + 1}`, values });
    }

    if (series.length > MAX_CHART_SERIES) {
        issues.push({
            severity: 'warning',
            path: `${path}.series`,
            message: `Only the first ${MAX_CHART_SERIES} of ${series.length} series are drawn.`,
        });
        series.length = MAX_CHART_SERIES;
    }
    if (kind === 'pie' && series.length > 1) {
        issues.push({
            severity: 'warning',
            path: `${path}.series`,
            message: 'A pie shows one series; the first is drawn.',
        });
        series.length = 1;
    }
    if (kind === 'pie' && categories.length > MAX_PIE_SLICES) {
        issues.push({
            severity: 'warning',
            path: `${path}.categories`,
            message: `Pie has more than ${MAX_PIE_SLICES} slices.`,
        });
    }

    const source = optionalText(raw.source);
    if (!source) {
        issues.push({ severity: 'warning', path: `${path}.source`, message: 'Chart data has no source.' });
    }

    return { kind, categories, series, unit: optionalText(raw.unit), source };
};

const LAYOUT_ALIASES: Record<string, Slide['layout']> = {
    title: 'title',
    cover: 'title',
    bullets: 'bullets',
    content: 'bullets',
    list: 'bullets',
    chart: 'chart',
};

const parseSlide = (raw: unknown, index: number, issues: DeckIssue[]): Slide | null => {
    const path = `slides[${index}]`;
    if (!isRecord(raw)) {
        issues.push({ severity: 'error', path, message: 'Slide is not an object; skipped.' });
        return null;
    }

    const rawLayout = typeof raw.layout === 'string' ? raw.layout.toLowerCase() : '';
    let layout = LAYOUT_ALIASES[rawLayout];
    if (!layout) {
        // Read by content, so a slide with an unknown layout name still shows what it says.
        if (raw.chart !== undefined) {
            layout = 'chart';
        } else if (raw.bullets !== undefined) {
            layout = 'bullets';
        } else {
            layout = index === 0 ? 'title' : 'bullets';
        }
        issues.push({
            severity: 'warning',
            path: `${path}.layout`,
            message: `Unknown layout "${raw.layout}", shown as ${layout}.`,
        });
    }

    const title = cleanText(raw.title);
    if (!title) {
        issues.push({ severity: 'error', path: `${path}.title`, message: 'Slide has no title; skipped.' });
        return null;
    }
    if (countWords(title) > LONG_TITLE_WORDS) {
        issues.push({
            severity: 'warning',
            path: `${path}.title`,
            message: `Title has more than ${LONG_TITLE_WORDS} words.`,
        });
    }
    const notes = optionalText(raw.notes);

    if (layout === 'title') {
        return { layout, title, subtitle: optionalText(raw.subtitle), notes };
    }
    if (layout === 'chart') {
        return {
            layout,
            title,
            chart: parseChart(raw.chart, `${path}.chart`, issues),
            takeaway: optionalText(raw.takeaway),
            notes,
        };
    }
    return { layout, title, bullets: parseBullets(raw.bullets, `${path}.bullets`, issues), notes };
};

/** Reads model output (a JSON string or an already parsed value) into a deck the renderer can draw. */
export const parseDeck = (input: unknown): ParsedDeck => {
    const issues: DeckIssue[] = [];
    let raw = input;
    if (typeof input === 'string') {
        try {
            raw = JSON.parse(input);
        } catch {
            // Models sometimes drop a comma or leave extra brackets in a long deck (model eval,
            // 2026-10-15); those are repaired and reported rather than losing the whole deck.
            const repaired = repairJson(input);
            if (!repaired) {
                return { deck: null, issues: [{ severity: 'error', path: '', message: 'Not valid JSON.' }] };
            }
            raw = JSON.parse(repaired);
            issues.push({ severity: 'warning', path: '', message: 'JSON was malformed and has been repaired.' });
        }
    }
    if (!isRecord(raw)) {
        return { deck: null, issues: [{ severity: 'error', path: '', message: 'Deck is not an object.' }] };
    }
    if (raw.version !== undefined && raw.version !== DECK_VERSION) {
        issues.push({
            severity: 'warning',
            path: 'version',
            message: `Unknown version ${raw.version}, read as ${DECK_VERSION}.`,
        });
    }
    if (!Array.isArray(raw.slides) || raw.slides.length === 0) {
        return {
            deck: null,
            issues: [...issues, { severity: 'error', path: 'slides', message: 'Deck has no slides.' }],
        };
    }

    const slides = raw.slides
        .map((slide, index) => {
            return parseSlide(slide, index, issues);
        })
        .filter((slide): slide is Slide => {
            return slide !== null;
        });
    if (slides.length === 0) {
        return { deck: null, issues };
    }

    const gaps = Array.isArray(raw.gaps) ? raw.gaps.map(cleanText).filter(Boolean) : [];
    const calculated = Array.isArray(raw.calculated)
        ? raw.calculated.flatMap((item): CalculatedNumber[] => {
              const value = isRecord(item)
                  ? typeof item.value === 'number'
                      ? String(item.value)
                      : cleanText(item.value)
                  : '';
              return value ? [{ value, how: isRecord(item) ? cleanText(item.how) : '' }] : [];
          })
        : [];
    const title = cleanText(raw.title) || slides[0]!.title;

    return { deck: { version: DECK_VERSION, title, slides, gaps, calculated }, issues };
};
