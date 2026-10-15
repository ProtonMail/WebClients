import JSZip from 'jszip';

import type { Box } from '../slideTokens';

/**
 * Reads back a generated .pptx: shapes with their position and text formatting, chart data, and
 * notes. The checks run on this rather than on the layout, so they test what was actually written.
 * Handles the subset of PresentationML that `deckToPptx` produces; it isn't a general reader.
 */

const EMU_PER_IN = 914400;
const EMU_PER_PT = 12700;
// PowerPoint's default text insets when a shape doesn't set them: 0.1" left/right, 0.05" top/bottom.
const DEFAULT_INSET_LR_EMU = 91440;
const DEFAULT_INSET_TB_EMU = 45720;

export interface InspectedParagraph {
    text: string;
    sizePt: number;
    bold: boolean;
    marginLeftPt: number;
    /** Exact line spacing, when set. */
    lineSpacingPt?: number;
    /** Explicit, or inherited from the master's body style for body placeholders. */
    spaceBeforePt: number;
    spaceAfterPt: number;
}

export interface InspectedShape {
    name: string;
    kind: 'text' | 'chart' | 'picture' | 'other';
    placeholder?: string;
    box: Box;
    insetsPt: { left: number; top: number; right: number; bottom: number };
    paragraphs: InspectedParagraph[];
}

export interface InspectedChart {
    categories: string[];
    series: number[][];
}

export interface InspectedSlide {
    shapes: InspectedShape[];
    charts: InspectedChart[];
    notes: string;
}

export interface InspectedDeck {
    widthIn: number;
    heightIn: number;
    slides: InspectedSlide[];
}

const parseXml = (xml: string): Document => {
    return new DOMParser().parseFromString(xml, 'application/xml');
};

const first = (parent: Element | Document, tagName: string): Element | undefined => {
    return parent.getElementsByTagName(tagName)[0];
};

const all = (parent: Element | Document, tagName: string): Element[] => {
    return Array.from(parent.getElementsByTagName(tagName));
};

const numberAttr = (element: Element | undefined, name: string): number | undefined => {
    const value = element?.getAttribute(name);
    return value === null || value === undefined || value === '' ? undefined : Number(value);
};

const readText = async (zip: JSZip, path: string): Promise<string> => {
    const file = zip.file(path);
    if (!file) {
        throw new Error(`Missing ${path} in the .pptx.`);
    }
    return file.async('string');
};

/** Targets of a part's relationships, resolved against `ppt/<folder>/`. */
const readRelationships = async (zip: JSZip, folder: string, fileName: string): Promise<Record<string, string>> => {
    const file = zip.file(`ppt/${folder}/_rels/${fileName}.rels`);
    if (!file) {
        return {};
    }
    const doc = parseXml(await file.async('string'));
    const targets: Record<string, string> = {};
    for (const relationship of all(doc, 'Relationship')) {
        const target = relationship.getAttribute('Target') ?? '';
        let resolved = `ppt/${folder}/${target}`;
        if (target.startsWith('/')) {
            resolved = target.slice(1);
        } else if (target.startsWith('../')) {
            resolved = `ppt/${target.slice(3)}`;
        }
        targets[relationship.getAttribute('Id') ?? ''] = resolved;
    }
    return targets;
};

const readBox = (shape: Element): Box => {
    const off = first(shape, 'a:off');
    const ext = first(shape, 'a:ext');
    return {
        x: (numberAttr(off, 'x') ?? 0) / EMU_PER_IN,
        y: (numberAttr(off, 'y') ?? 0) / EMU_PER_IN,
        w: (numberAttr(ext, 'cx') ?? 0) / EMU_PER_IN,
        h: (numberAttr(ext, 'cy') ?? 0) / EMU_PER_IN,
    };
};

/** Paragraph spacing in points from an `a:spcBef`/`a:spcAft` element: absolute or a percentage of the font size. */
const readSpacingPt = (spacing: Element | undefined, sizePt: number): number | undefined => {
    if (!spacing) {
        return undefined;
    }
    const points = numberAttr(first(spacing, 'a:spcPts'), 'val');
    if (points !== undefined) {
        return points / 100;
    }
    const percent = numberAttr(first(spacing, 'a:spcPct'), 'val');
    return percent === undefined ? undefined : (percent / 100000) * sizePt;
};

/** Spacing a level inherits from the master's text style, by level (1–9). */
export type InheritedSpacing = Record<number, Element | undefined>;

const readParagraph = (paragraph: Element, inheritedSpaceBefore: InheritedSpacing): InspectedParagraph => {
    const properties = first(paragraph, 'a:pPr');
    const runProperties = first(paragraph, 'a:rPr') ?? first(paragraph, 'a:endParaRPr');
    const lineSpacing = properties ? first(properties, 'a:lnSpc') : undefined;
    const lineSpacingPts = lineSpacing ? numberAttr(first(lineSpacing, 'a:spcPts'), 'val') : undefined;
    const sizePt = (numberAttr(runProperties, 'sz') ?? 1800) / 100;
    const level = (numberAttr(properties, 'lvl') ?? 0) + 1;
    const explicitBefore = properties ? first(properties, 'a:spcBef') : undefined;
    return {
        text: all(paragraph, 'a:t')
            .map((node) => {
                return node.textContent ?? '';
            })
            .join(''),
        sizePt,
        bold: runProperties?.getAttribute('b') === '1',
        marginLeftPt: (numberAttr(properties, 'marL') ?? 0) / EMU_PER_PT,
        lineSpacingPt: lineSpacingPts === undefined ? undefined : lineSpacingPts / 100,
        spaceBeforePt: readSpacingPt(explicitBefore ?? inheritedSpaceBefore[level], sizePt) ?? 0,
        spaceAfterPt: readSpacingPt(properties ? first(properties, 'a:spcAft') : undefined, sizePt) ?? 0,
    };
};

const readShape = (element: Element, masterBodySpaceBefore: InheritedSpacing): InspectedShape => {
    const tag = element.tagName;
    const bodyProperties = first(element, 'a:bodyPr');
    const inset = (name: string, fallback: number): number => {
        return (numberAttr(bodyProperties, name) ?? fallback) / EMU_PER_PT;
    };
    let kind: InspectedShape['kind'] = 'other';
    if (tag === 'p:pic') {
        kind = 'picture';
    } else if (tag === 'p:graphicFrame' && first(element, 'c:chart')) {
        kind = 'chart';
    } else if (tag === 'p:sp' && first(element, 'p:txBody')) {
        kind = 'text';
    }
    const placeholder = first(element, 'p:ph')?.getAttribute('type') ?? undefined;
    // Only body placeholders take the master's body style; titles and free text boxes have their own.
    const inherited = placeholder === 'body' ? masterBodySpaceBefore : {};
    return {
        name: first(element, 'p:cNvPr')?.getAttribute('name') ?? '',
        kind,
        placeholder,
        box: readBox(element),
        insetsPt: {
            left: inset('lIns', DEFAULT_INSET_LR_EMU),
            top: inset('tIns', DEFAULT_INSET_TB_EMU),
            right: inset('rIns', DEFAULT_INSET_LR_EMU),
            bottom: inset('bIns', DEFAULT_INSET_TB_EMU),
        },
        paragraphs:
            kind === 'text'
                ? all(element, 'a:p').map((paragraph) => {
                      return readParagraph(paragraph, inherited);
                  })
                : [],
    };
};

const readChart = async (zip: JSZip, path: string): Promise<InspectedChart> => {
    const doc = parseXml(await readText(zip, path));
    const series = all(doc, 'c:ser');
    const cachePoints = (parent: Element | undefined): string[] => {
        return parent
            ? all(parent, 'c:pt').map((point) => {
                  return first(point, 'c:v')?.textContent ?? '';
              })
            : [];
    };
    return {
        categories: cachePoints(series[0] ? first(series[0], 'c:cat') : undefined),
        series: series.map((item) => {
            return cachePoints(first(item, 'c:val')).map(Number);
        }),
    };
};

const readNotes = async (zip: JSZip, path: string | undefined): Promise<string> => {
    if (!path) {
        return '';
    }
    const doc = parseXml(await readText(zip, path));
    // The notes text is in the body placeholder; the other one holds the slide image.
    const body = all(doc, 'p:sp').find((shape) => {
        return first(shape, 'p:ph')?.getAttribute('type') === 'body';
    });
    return body
        ? all(body, 'a:t')
              .map((node) => {
                  return node.textContent ?? '';
              })
              .join(' ')
              .trim()
        : '';
};

export const inspectPptx = async (bytes: ArrayBuffer | Uint8Array<ArrayBuffer>): Promise<InspectedDeck> => {
    const zip = await JSZip.loadAsync(bytes);
    const presentation = parseXml(await readText(zip, 'ppt/presentation.xml'));
    const size = first(presentation, 'p:sldSz');
    // deckToPptx files have one master; its body style is what body placeholders inherit.
    const master = parseXml(await readText(zip, 'ppt/slideMasters/slideMaster1.xml'));
    const bodyStyle = first(master, 'p:bodyStyle');
    const masterBodySpaceBefore: InheritedSpacing = {};
    for (let level = 1; level <= 9; level++) {
        const levelProperties = bodyStyle ? first(bodyStyle, `a:lvl${level}pPr`) : undefined;
        masterBodySpaceBefore[level] = levelProperties ? first(levelProperties, 'a:spcBef') : undefined;
    }

    const slideNames = Object.keys(zip.files)
        .map((path) => {
            return path.match(/^ppt\/slides\/(slide(\d+)\.xml)$/);
        })
        .filter((match): match is RegExpMatchArray => {
            return match !== null;
        })
        .sort((a, b) => {
            return Number(a[2]) - Number(b[2]);
        })
        .map((match) => {
            return match[1]!;
        });

    const slides: InspectedSlide[] = [];
    for (const slideName of slideNames) {
        const doc = parseXml(await readText(zip, `ppt/slides/${slideName}`));
        const relationships = await readRelationships(zip, 'slides', slideName);
        const tree = first(doc, 'p:spTree');
        const elements = tree
            ? Array.from(tree.childNodes).filter((node): node is Element => {
                  return node.nodeType === 1 && ['p:sp', 'p:graphicFrame', 'p:pic'].includes((node as Element).tagName);
              })
            : [];
        const charts: InspectedChart[] = [];
        for (const element of elements) {
            const chartId = first(element, 'c:chart')?.getAttribute('r:id');
            const chartPath = chartId ? relationships[chartId] : undefined;
            if (chartPath) {
                charts.push(await readChart(zip, chartPath));
            }
        }
        const notesPath = Object.values(relationships).find((target) => {
            return target.includes('notesSlides/');
        });
        slides.push({
            shapes: elements.map((element) => {
                return readShape(element, masterBodySpaceBefore);
            }),
            charts,
            notes: await readNotes(zip, notesPath),
        });
    }

    return {
        widthIn: (numberAttr(size, 'cx') ?? 0) / EMU_PER_IN,
        heightIn: (numberAttr(size, 'cy') ?? 0) / EMU_PER_IN,
        slides,
    };
};
