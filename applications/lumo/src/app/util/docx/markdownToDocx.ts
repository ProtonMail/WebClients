import type * as Docx from 'docx';
import type { IParagraphOptions, Paragraph, ParagraphChild, Table } from 'docx';
import type {
    Definition,
    FootnoteDefinition,
    List,
    ListItem,
    Table as MarkdownTable,
    Nodes,
    Parents,
    PhrasingContent,
    Root,
    RootContent,
} from 'mdast';

import { parseMarkdownToAst } from '../markdown/parseMarkdownToAst';

// The docx library is loaded on demand, so its classes are reached through the module object.
type DocxModule = typeof Docx;
type DocxBlock = Paragraph | Table;

export const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Word measures layout in twips (1/20 pt; 1440 per inch) and font sizes in half-points.
const PAGE_MARGIN_TWIPS = 1440;
// A4 (the docx library's default page size) minus the 1" margins on each side.
const CONTENT_WIDTH_TWIPS = 11906 - 2 * PAGE_MARGIN_TWIPS;
const LIST_INDENT_TWIPS = 720;
const LIST_HANGING_TWIPS = 360;
const QUOTE_INDENT_TWIPS = 360;
const MAX_LIST_LEVEL = 8;

// Fonts that ship with Windows and macOS and exist in Google Docs, so no app has to substitute.
// (Calibri/Consolas only exist where Microsoft Office is installed; Pages fell back to a mix of
// Helvetica and Times.)
const BODY_FONT = 'Arial';
const CODE_FONT = 'Courier New';
const BODY_SIZE = 22;
const CODE_SIZE = 20;
const FOOTNOTE_SIZE = 18;
const HEADING_SIZES = [40, 32, 26, 24, 22, 22];
const LINE_SPACING = 300;
const BODY_SPACING = { after: 180, line: LINE_SPACING };
const TIGHT_LIST_SPACING = { after: 60, line: LINE_SPACING };
const HEADING_SPACING = { before: 280, after: 120, line: LINE_SPACING };
const CODE_SPACING = { before: 120, after: 180, line: 240 };
const CODE_STYLE_ID = 'LumoCode';
const BULLET_REFERENCE = 'lumo-bullet';
const MUTED_TEXT_COLOR = '595959';
const RULE_COLOR = 'BFBFBF';
const CODE_BACKGROUND = 'F2F2F2';
const TABLE_HEADER_BACKGROUND = 'F2F2F2';

const BULLET_SYMBOLS = ['•', '◦', '▪'];
const SAFE_LINK_PATTERN = /^(https?:|mailto:)/i;
// Characters that are not allowed in XML 1.0 and would make Word reject the whole file.
const XML_INVALID_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

interface InlineStyle {
    size?: number;
    bold?: boolean;
    italics?: boolean;
    strike?: boolean;
    color?: string;
    hyperlink?: boolean;
}

interface BlockScope {
    /** List nesting level of the enclosing list item, if any. */
    listLevel?: number;
    quoteDepth: number;
    /** Tight lists (no blank lines between items) get compact item spacing, as in the preview. */
    tightList?: boolean;
    /** Text size for the block's content, in half-points; footnotes use a smaller size. */
    textSize?: number;
}

interface ConversionContext {
    docx: DocxModule;
    definitions: Map<string, Definition>;
    footnoteDefinitions: Map<string, FootnoteDefinition>;
    footnoteIds: Map<string, number>;
    orderedListConfigs: { reference: string; start: number }[];
}

export interface MarkdownToDocxOptions {
    title: string;
    creator?: string;
}

function cleanText(value: string): string {
    return value.replace(XML_INVALID_CHARACTERS, '');
}

function isParent(node: Nodes): node is Parents {
    return 'children' in node;
}

function collectNodes<T extends Nodes>(node: Nodes, type: T['type']): T[] {
    const matches: T[] = node.type === type ? [node as T] : [];

    if (!isParent(node)) {
        return matches;
    }

    return matches.concat(
        ...(node.children as Nodes[]).map((child) => {
            return collectNodes<T>(child, type);
        })
    );
}

function getListIndent(level: number): number {
    return LIST_INDENT_TWIPS * (level + 1);
}

function getBlockIndent(scope: BlockScope): number {
    const listIndent = scope.listLevel === undefined ? 0 : getListIndent(scope.listLevel);
    return listIndent + scope.quoteDepth * QUOTE_INDENT_TWIPS;
}

function getScopeTextStyle(scope: BlockScope): InlineStyle {
    return {
        size: scope.textSize ?? BODY_SIZE,
        color: scope.quoteDepth > 0 ? MUTED_TEXT_COLOR : undefined,
    };
}

function getQuoteBorder(ctx: ConversionContext, scope: BlockScope) {
    if (scope.quoteDepth === 0) {
        return undefined;
    }

    return {
        left: { style: ctx.docx.BorderStyle.SINGLE, size: 18, color: RULE_COLOR, space: 8 },
    };
}

// Font and size are set on every run, not only in the styles: readers other than Word (Pages,
// Quick Look) don't reliably apply the document defaults, and fell back to their own fonts.
function createTextRun(ctx: ConversionContext, text: string, style: InlineStyle, code = false): ParagraphChild {
    const { TextRun, ShadingType } = ctx.docx;
    const size = style.size ?? BODY_SIZE;

    return new TextRun({
        text: cleanText(text),
        font: code ? CODE_FONT : BODY_FONT,
        size: code ? size - 2 : size,
        bold: style.bold,
        italics: style.italics,
        strike: style.strike,
        color: style.hyperlink ? undefined : style.color,
        style: style.hyperlink ? 'Hyperlink' : undefined,
        shading: code ? { type: ShadingType.CLEAR, color: 'auto', fill: CODE_BACKGROUND } : undefined,
    });
}

function getFootnoteId(ctx: ConversionContext, identifier: string): number | undefined {
    if (!ctx.footnoteDefinitions.has(identifier)) {
        return undefined;
    }

    const existing = ctx.footnoteIds.get(identifier);
    if (existing !== undefined) {
        return existing;
    }

    const id = ctx.footnoteIds.size + 1;
    ctx.footnoteIds.set(identifier, id);
    return id;
}

function createLink(ctx: ConversionContext, url: string, children: ParagraphChild[]): ParagraphChild[] {
    // Only web and mail links become clickable; anything else (javascript:, file:, relative paths)
    // keeps its text but drops the link.
    if (!SAFE_LINK_PATTERN.test(url.trim())) {
        return children;
    }

    return [new ctx.docx.ExternalHyperlink({ link: url.trim(), children })];
}

function phrasingToInlines(ctx: ConversionContext, nodes: PhrasingContent[], style: InlineStyle): ParagraphChild[] {
    return nodes.flatMap((node): ParagraphChild[] => {
        switch (node.type) {
            case 'text':
                // A single newline inside a markdown paragraph is a soft break, rendered as a space.
                return [createTextRun(ctx, node.value.replace(/\n/g, ' '), style)];
            case 'strong':
                return phrasingToInlines(ctx, node.children, { ...style, bold: true });
            case 'emphasis':
                return phrasingToInlines(ctx, node.children, { ...style, italics: true });
            case 'delete':
                return phrasingToInlines(ctx, node.children, { ...style, strike: true });
            case 'inlineCode':
                return [createTextRun(ctx, node.value, style, true)];
            case 'break':
                return [new ctx.docx.TextRun({ break: 1 })];
            case 'link':
                return createLink(ctx, node.url, phrasingToInlines(ctx, node.children, { ...style, hyperlink: true }));
            case 'linkReference': {
                const definition = ctx.definitions.get(node.identifier);
                const linkStyle = definition ? { ...style, hyperlink: true } : style;
                const children = phrasingToInlines(ctx, node.children, linkStyle);
                return definition ? createLink(ctx, definition.url, children) : children;
            }
            case 'image':
            case 'imageReference': {
                // Images are not embedded: fetching them would contact third-party servers from the
                // user's browser. Keep the alt text, linked to the source when it is a web URL.
                const url = node.type === 'image' ? node.url : ctx.definitions.get(node.identifier)?.url;
                const label = node.alt?.trim() || url || '';
                if (!label) {
                    return [];
                }
                const altText = createTextRun(ctx, `[${label}]`, { ...style, italics: true, hyperlink: !!url });
                return url ? createLink(ctx, url, [altText]) : [altText];
            }
            case 'footnoteReference': {
                const id = getFootnoteId(ctx, node.identifier);
                if (id === undefined) {
                    return [createTextRun(ctx, `[^${node.label ?? node.identifier}]`, style)];
                }
                return [new ctx.docx.FootnoteReferenceRun(id)];
            }
            case 'html': {
                // Raw HTML is not rendered in the preview either; keep only its text.
                const text = node.value.replace(/<[^>]*>/g, '');
                return text ? [createTextRun(ctx, text, style)] : [];
            }
            default:
                return [];
        }
    });
}

function createParagraph(
    ctx: ConversionContext,
    children: ParagraphChild[],
    scope: BlockScope,
    extra: IParagraphOptions = {}
): Paragraph {
    const indent = getBlockIndent(scope);

    return new ctx.docx.Paragraph({
        children,
        indent: indent > 0 ? { left: indent } : undefined,
        border: getQuoteBorder(ctx, scope),
        spacing: scope.tightList ? TIGHT_LIST_SPACING : BODY_SPACING,
        ...extra,
    });
}

function listToBlocks(ctx: ConversionContext, list: List, scope: BlockScope): DocxBlock[] {
    const level = Math.min(scope.listLevel === undefined ? 0 : scope.listLevel + 1, MAX_LIST_LEVEL);
    const tightList = list.spread !== true;
    let numbering: { reference: string; level: number } = { reference: BULLET_REFERENCE, level };

    if (list.ordered) {
        // Each ordered list gets its own numbering definition so it starts from its own number
        // instead of continuing the previous list's count.
        const reference = `lumo-ordered-${ctx.orderedListConfigs.length + 1}`;
        ctx.orderedListConfigs.push({ reference, start: list.start ?? 1 });
        numbering = { reference, level };
    }

    return list.children.flatMap((item: ListItem, itemIndex) => {
        // The last item of a top-level list gets normal spacing, so the next paragraph doesn't sit on it.
        const endsList = scope.listLevel === undefined && itemIndex === list.children.length - 1;
        const itemScope: BlockScope = { ...scope, listLevel: level, tightList: tightList && !endsList };
        let markerUsed = false;

        return item.children.flatMap((child): DocxBlock[] => {
            if (child.type === 'paragraph' && !markerUsed) {
                markerUsed = true;
                const inlines = phrasingToInlines(ctx, child.children, getScopeTextStyle(scope));

                if (typeof item.checked === 'boolean') {
                    // Task list item: a checkbox glyph where the bullet would be. The hanging indent
                    // acts as a tab stop, so the tab lines the text up with regular list items.
                    return [
                        createParagraph(
                            ctx,
                            [
                                new ctx.docx.TextRun({
                                    font: BODY_FONT,
                                    size: scope.textSize ?? BODY_SIZE,
                                    children: [item.checked ? '☒' : '☐', new ctx.docx.Tab()],
                                }),
                                ...inlines,
                            ],
                            {
                                ...itemScope,
                            },
                            {
                                indent: { left: getListIndent(level), hanging: LIST_HANGING_TWIPS },
                            }
                        ),
                    ];
                }

                return [
                    new ctx.docx.Paragraph({
                        children: inlines,
                        style: 'ListParagraph',
                        numbering,
                        border: getQuoteBorder(ctx, scope),
                        spacing: itemScope.tightList ? TIGHT_LIST_SPACING : BODY_SPACING,
                    }),
                ];
            }

            // Nested lists go one level deeper; any other content continues the item, aligned with its text.
            return blockToDocx(ctx, child, child.type === 'list' ? { ...scope, listLevel: level } : itemScope);
        });
    });
}

function tableToDocx(ctx: ConversionContext, table: MarkdownTable, scope: BlockScope): Table {
    const { Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, AlignmentType, BorderStyle } = ctx.docx;
    const columnCount = Math.max(
        1,
        ...table.children.map((row) => {
            return row.children.length;
        })
    );
    const indent = getBlockIndent(scope);
    const tableWidth = CONTENT_WIDTH_TWIPS - indent;
    const columnWidth = Math.floor(tableWidth / columnCount);
    const border = { style: BorderStyle.SINGLE, size: 4, color: RULE_COLOR };
    const alignments = {
        left: AlignmentType.LEFT,
        center: AlignmentType.CENTER,
        right: AlignmentType.RIGHT,
    };

    return new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: Array.from({ length: columnCount }, () => {
            return columnWidth;
        }),
        indent: indent > 0 ? { size: indent, type: WidthType.DXA } : undefined,
        borders: {
            top: border,
            bottom: border,
            left: border,
            right: border,
            insideHorizontal: border,
            insideVertical: border,
        },
        rows: table.children.map((row, rowIndex) => {
            const isHeader = rowIndex === 0;

            return new TableRow({
                // Repeat the header row at the top of each page, like the print stylesheet does.
                tableHeader: isHeader,
                cantSplit: true,
                children: Array.from({ length: columnCount }, (_, columnIndex) => {
                    const cell = row.children[columnIndex];
                    const align = table.align?.[columnIndex];

                    return new TableCell({
                        width: { size: columnWidth, type: WidthType.DXA },
                        shading: isHeader
                            ? { type: ShadingType.CLEAR, color: 'auto', fill: TABLE_HEADER_BACKGROUND }
                            : undefined,
                        margins: { top: 60, bottom: 60, left: 100, right: 100 },
                        children: [
                            new Paragraph({
                                alignment: align ? alignments[align] : undefined,
                                spacing: { after: 0, line: LINE_SPACING },
                                children: cell
                                    ? phrasingToInlines(ctx, cell.children, { size: BODY_SIZE, bold: isHeader })
                                    : [],
                            }),
                        ],
                    });
                }),
            });
        }),
    });
}

// A one-cell table with only its top border drawn. A paragraph bottom border (what Word inserts for
// "---") is the more natural encoding, but Pages and Quick Look don't draw paragraph borders from
// .docx files, while every reader draws table borders.
function horizontalRuleToDocx(ctx: ConversionContext, scope: BlockScope): Table {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle, TableLayoutType } = ctx.docx;
    const indent = getBlockIndent(scope);
    const width = CONTENT_WIDTH_TWIPS - indent;
    const none = { style: BorderStyle.NONE, size: 0, color: 'auto' };

    return new Table({
        // Fixed layout so readers use the declared width instead of shrinking the empty cell.
        layout: TableLayoutType.FIXED,
        width: { size: width, type: WidthType.DXA },
        columnWidths: [width],
        indent: indent > 0 ? { size: indent, type: WidthType.DXA } : undefined,
        borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: RULE_COLOR },
            bottom: none,
            left: none,
            right: none,
            insideHorizontal: none,
            insideVertical: none,
        },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: width, type: WidthType.DXA },
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [
                            // A 1pt empty line keeps the cell thin; the spacing is the gap below the rule.
                            new Paragraph({
                                spacing: { after: BODY_SPACING.after, line: 240 },
                                children: [new TextRun({ text: '', size: 2 })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}

function blockToDocx(ctx: ConversionContext, node: RootContent, scope: BlockScope): DocxBlock[] {
    const { docx } = ctx;

    switch (node.type) {
        case 'heading': {
            const headingLevels = [
                docx.HeadingLevel.HEADING_1,
                docx.HeadingLevel.HEADING_2,
                docx.HeadingLevel.HEADING_3,
                docx.HeadingLevel.HEADING_4,
                docx.HeadingLevel.HEADING_5,
                docx.HeadingLevel.HEADING_6,
            ];
            const headingStyle: InlineStyle = {
                ...getScopeTextStyle(scope),
                size: HEADING_SIZES[node.depth - 1],
                bold: true,
                italics: node.depth === 6 || undefined,
                color: node.depth === 6 ? MUTED_TEXT_COLOR : getScopeTextStyle(scope).color,
            };
            return [
                createParagraph(ctx, phrasingToInlines(ctx, node.children, headingStyle), scope, {
                    heading: headingLevels[node.depth - 1],
                    spacing: HEADING_SPACING,
                    keepNext: true,
                    keepLines: true,
                }),
            ];
        }
        case 'paragraph':
            return [createParagraph(ctx, phrasingToInlines(ctx, node.children, getScopeTextStyle(scope)), scope)];
        case 'blockquote':
            return node.children.flatMap((child) => {
                return blockToDocx(ctx, child, { ...scope, quoteDepth: scope.quoteDepth + 1, tightList: false });
            });
        case 'list':
            return listToBlocks(ctx, node, scope);
        case 'code': {
            // One paragraph per block with line breaks, so the shaded background is continuous.
            const lines = node.value.split('\n');
            const runs = lines.map((line, index) => {
                return new docx.TextRun({
                    text: cleanText(line),
                    font: CODE_FONT,
                    size: CODE_SIZE,
                    break: index > 0 ? 1 : undefined,
                });
            });
            return [
                createParagraph(ctx, runs, scope, {
                    style: CODE_STYLE_ID,
                    border: undefined,
                    spacing: CODE_SPACING,
                    shading: { type: docx.ShadingType.CLEAR, color: 'auto', fill: CODE_BACKGROUND },
                }),
            ];
        }
        case 'table':
            return [tableToDocx(ctx, node, scope)];
        case 'thematicBreak':
            return [horizontalRuleToDocx(ctx, scope)];
        case 'html': {
            const text = node.value.replace(/<[^>]*>/g, '').trim();
            return text ? [createParagraph(ctx, [createTextRun(ctx, text, getScopeTextStyle(scope))], scope)] : [];
        }
        default:
            // Definitions and footnote definitions are consumed separately; nothing else renders.
            return [];
    }
}

function buildNumberingConfig(ctx: ConversionContext) {
    const { LevelFormat, AlignmentType } = ctx.docx;
    const orderedFormats = [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN];
    const levelIndexes = Array.from({ length: MAX_LIST_LEVEL + 1 }, (_, level) => {
        return level;
    });
    const getLevelStyle = (level: number) => {
        return {
            paragraph: { indent: { left: getListIndent(level), hanging: LIST_HANGING_TWIPS } },
            // Without an explicit font the list marker falls back to the app's default (Times in Pages).
            run: { font: BODY_FONT, size: BODY_SIZE },
        };
    };

    return [
        {
            reference: BULLET_REFERENCE,
            levels: levelIndexes.map((level) => {
                return {
                    level,
                    format: LevelFormat.BULLET,
                    text: BULLET_SYMBOLS[level % BULLET_SYMBOLS.length],
                    alignment: AlignmentType.LEFT,
                    style: getLevelStyle(level),
                };
            }),
        },
        ...ctx.orderedListConfigs.map(({ reference, start }) => {
            return {
                reference,
                levels: levelIndexes.map((level) => {
                    return {
                        level,
                        format: orderedFormats[level % orderedFormats.length],
                        text: `%${level + 1}.`,
                        start,
                        alignment: AlignmentType.LEFT,
                        style: getLevelStyle(level),
                    };
                }),
            };
        }),
    ];
}

function buildStyles(docx: DocxModule) {
    const heading = (size: number, options: { italics?: boolean; color?: string } = {}) => {
        return {
            run: { font: BODY_FONT, size, bold: true, italics: options.italics, color: options.color ?? '000000' },
            // keepNext keeps a heading on the same page as the text it introduces.
            paragraph: { spacing: HEADING_SPACING, keepNext: true, keepLines: true },
        };
    };

    return {
        default: {
            document: {
                run: { font: BODY_FONT, size: BODY_SIZE },
                paragraph: { spacing: BODY_SPACING },
            },
            heading1: heading(HEADING_SIZES[0]),
            heading2: heading(HEADING_SIZES[1]),
            heading3: heading(HEADING_SIZES[2]),
            heading4: heading(HEADING_SIZES[3]),
            heading5: heading(HEADING_SIZES[4]),
            heading6: heading(HEADING_SIZES[5], { italics: true, color: MUTED_TEXT_COLOR }),
        },
        paragraphStyles: [
            // Every other style is based on Normal, but the library doesn't define it; without it,
            // Pages applied its own body style.
            {
                id: 'Normal',
                name: 'Normal',
                quickFormat: true,
                run: { font: BODY_FONT, size: BODY_SIZE },
                paragraph: { spacing: BODY_SPACING },
            },
            {
                id: CODE_STYLE_ID,
                name: 'Code',
                basedOn: 'Normal',
                quickFormat: true,
                run: { font: CODE_FONT, size: CODE_SIZE },
                paragraph: {
                    spacing: CODE_SPACING,
                    shading: { type: docx.ShadingType.CLEAR, color: 'auto', fill: CODE_BACKGROUND },
                },
            },
        ],
    };
}

/**
 * Convert markdown to an editable Word document: headings, lists, tables, code, quotes, links and
 * footnotes become native Word structures (built-in heading styles, real numbering, table header
 * rows), so the file reflows and stays editable in Word, Pages, Google Docs and Proton Docs.
 */
export async function markdownToDocxBlob(markdown: string, options: MarkdownToDocxOptions): Promise<Blob> {
    const [docx, tree] = await Promise.all([
        import(/* webpackChunkName: "docx-export" */ 'docx'),
        parseMarkdownToAst(markdown),
    ]);

    return docx.Packer.toBlob(buildDocxDocument(docx, tree, options));
}

function buildDocxDocument(docx: DocxModule, tree: Root, options: MarkdownToDocxOptions) {
    const ctx: ConversionContext = {
        docx,
        definitions: new Map(
            collectNodes<Definition>(tree, 'definition').map((definition) => {
                return [definition.identifier, definition];
            })
        ),
        footnoteDefinitions: new Map(
            collectNodes<FootnoteDefinition>(tree, 'footnoteDefinition').map((definition) => {
                return [definition.identifier, definition];
            })
        ),
        footnoteIds: new Map(),
        orderedListConfigs: [],
    };

    const children = tree.children.flatMap((node) => {
        return blockToDocx(ctx, node, { quoteDepth: 0 });
    });

    // Footnote bodies are converted after the main text, which assigns ids in order of first reference.
    const footnotes: Record<string, { children: Paragraph[] }> = {};
    for (const [identifier, id] of ctx.footnoteIds) {
        const definition = ctx.footnoteDefinitions.get(identifier)!;
        footnotes[String(id)] = {
            children: definition.children
                .flatMap((child) => {
                    return blockToDocx(ctx, child, { quoteDepth: 0, textSize: FOOTNOTE_SIZE });
                })
                .filter((block): block is Paragraph => {
                    return block instanceof docx.Paragraph;
                }),
        };
    }

    return new docx.Document({
        title: options.title,
        creator: options.creator,
        lastModifiedBy: options.creator,
        styles: buildStyles(docx),
        numbering: { config: buildNumberingConfig(ctx) },
        footnotes,
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: PAGE_MARGIN_TWIPS,
                            right: PAGE_MARGIN_TWIPS,
                            bottom: PAGE_MARGIN_TWIPS,
                            left: PAGE_MARGIN_TWIPS,
                        },
                    },
                },
                // Word requires at least one paragraph in the body.
                children: children.length > 0 ? children : [new docx.Paragraph('')],
            },
        ],
    });
}
