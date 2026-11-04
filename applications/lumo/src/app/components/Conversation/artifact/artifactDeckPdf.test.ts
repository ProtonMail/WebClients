import { SLIDES_EVAL_FIXTURES } from '../../../util/slides/eval/slidesEvalFixtures';
import { buildDeckPdfBytes } from './artifactDeckPdf';
import type { ParsedArtifact } from './parseArtifacts';

interface Capture {
    className: string | null;
    text: string;
    images: number;
    inDocument: boolean;
}

const mockCaptures: Capture[] = [];
const mockAddPage = jest.fn();
const mockAddImage = jest.fn();

const mockHtml2canvas = jest.fn(async (element: HTMLElement) => {
    // Read what html2canvas would see at the moment it is called.
    mockCaptures.push({
        className: element.getAttribute('class'),
        text: element.textContent ?? '',
        images: element.querySelectorAll('img').length,
        inDocument: document.body.contains(element),
    });
    return {
        width: 1,
        height: 1,
        toDataURL: () => {
            return 'data:image/png;base64,';
        },
    };
});

jest.mock('html2canvas', () => {
    return {
        __esModule: true,
        default: mockHtml2canvas,
    };
});

jest.mock('jspdf', () => {
    return {
        jsPDF: jest.fn().mockImplementation(() => {
            return {
                setProperties: jest.fn(),
                addPage: mockAddPage,
                addImage: mockAddImage,
                output: () => {
                    return new ArrayBuffer(8);
                },
            };
        }),
    };
});

jest.mock('../../../util/export/exportUiHelpers', () => {
    return {
        yieldToMainThread: () => {
            return Promise.resolve();
        },
    };
});

const cjkDeck = (): any => {
    const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
        return item.id === 'cjk-text';
    })!;
    return JSON.parse(JSON.stringify(fixture.modelOutput));
};

const deckArtifact = (deck: unknown): ParsedArtifact => {
    return { id: 'deck', type: 'presentation', title: 'Deck', content: JSON.stringify(deck) };
};

describe('buildDeckPdfBytes image fallback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCaptures.length = 0;
    });

    it('captures every slide from a mounted element without the preview frame, then cleans up', async () => {
        await buildDeckPdfBytes(deckArtifact(cjkDeck()));

        expect(mockCaptures).toHaveLength(2);
        expect(mockCaptures[0]!.text).toContain('新製品の発売計画と販売スケジュールについて');
        expect(mockCaptures[1]!.text).toContain('発売スケジュール');
        mockCaptures.forEach((capture) => {
            expect(capture.inDocument).toBe(true);
            // Rounded corners and the shadow would show as white corners on the page.
            expect(capture.className).toBeNull();
        });
        expect(mockAddImage).toHaveBeenCalledTimes(2);
        expect(mockAddPage).toHaveBeenCalledTimes(1);
        expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('draws markup in deck text as text', async () => {
        const deck = cjkDeck();
        deck.slides[1].title = '<img src=x onerror="alert(1)"> 発売スケジュール';

        await buildDeckPdfBytes(deckArtifact(deck));

        expect(mockCaptures[1]!.images).toBe(0);
        expect(mockCaptures[1]!.text).toContain('<img src=x onerror="alert(1)">');
    });

    it('removes the capture element when a capture fails', async () => {
        mockHtml2canvas.mockRejectedValueOnce(new Error('capture failed'));

        await expect(buildDeckPdfBytes(deckArtifact(cjkDeck()))).rejects.toThrow('capture failed');

        expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
    });
});
