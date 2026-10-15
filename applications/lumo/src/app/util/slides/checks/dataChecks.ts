import { type Deck, isMissingChart } from '../deck';

/**
 * "Never invent data": every number on a slide should appear in the material the user gave (their
 * messages, files and web search results). This flags the ones that don't, for the user to confirm;
 * it doesn't block them. Numbers the model lists in `calculated` (totals, averages, percentages) are
 * still returned, with how they were calculated, so they can be shown as calculated, not as missing.
 */

export interface UnsourcedNumber {
    /** Index into `deck.slides`. */
    sourceSlide: number;
    where: string;
    value: string;
    /** Set when the model listed this number as one it calculated: how it did. */
    calculatedAs?: string;
}

// Digits with optional grouping or decimal separators (, . ' and narrow/no-break spaces) and a %.
const NUMBER_TOKEN = /\d+(?:[.,'  ]\d+)*%?/g;

/**
 * Every value a written number could mean. "1,250" is 1250 in English and 1.25 in German; both are
 * kept, because the check only asks whether the source contains the same number.
 */
export const readNumberValues = (token: string): number[] => {
    const plain = token.replace(/%$/, '').replace(/['  ]/g, '');
    const values = new Set<number>();
    const commas = (plain.match(/,/g) ?? []).length;
    const dots = (plain.match(/\./g) ?? []).length;
    if (commas === 0 && dots === 0) {
        values.add(Number(plain));
    } else if (commas > 0 && dots > 0) {
        // Both separators: the last one is the decimal point.
        const decimal = plain.lastIndexOf(',') > plain.lastIndexOf('.') ? ',' : '.';
        const grouping = decimal === ',' ? '.' : ',';
        values.add(Number(plain.split(grouping).join('').replace(decimal, '.')));
    } else {
        const separator = commas > 0 ? ',' : '.';
        values.add(Number(plain.split(separator).join('')));
        if ((separator === ',' ? commas : dots) === 1) {
            values.add(Number(plain.replace(separator, '.')));
        }
    }
    return Array.from(values).filter(Number.isFinite);
};

const numbersIn = (text: string): string[] => {
    return text.match(NUMBER_TOKEN) ?? [];
};

const sameNumber = (a: number, b: number): boolean => {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
};

export const findUnsourcedNumbers = (deck: Deck, sourceText: string): UnsourcedNumber[] => {
    const sourceValues = numbersIn(sourceText).flatMap(readNumberValues);
    const isSourced = (value: number): boolean => {
        return sourceValues.some((sourceValue) => {
            return sameNumber(sourceValue, value);
        });
    };
    const calculatedAs = (value: number): string | undefined => {
        return deck.calculated.find((item) => {
            return numbersIn(item.value)
                .flatMap(readNumberValues)
                .some((calculated) => {
                    return sameNumber(calculated, value);
                });
        })?.how;
    };
    const findings: UnsourcedNumber[] = [];
    const add = (sourceSlide: number, where: string, value: string, values: number[]): void => {
        const how = values.map(calculatedAs).find((item) => {
            return item !== undefined;
        });
        findings.push(
            how === undefined ? { sourceSlide, where, value } : { sourceSlide, where, value, calculatedAs: how }
        );
    };
    const checkText = (sourceSlide: number, where: string, text: string | undefined): void => {
        for (const token of numbersIn(text ?? '')) {
            const values = readNumberValues(token);
            if (!values.some(isSourced)) {
                add(sourceSlide, where, token, values);
            }
        }
    };

    deck.slides.forEach((slide, index) => {
        checkText(index, 'title', slide.title);
        if (slide.layout === 'title') {
            checkText(index, 'subtitle', slide.subtitle);
        } else if (slide.layout === 'bullets') {
            slide.bullets.forEach((bullet, bulletIndex) => {
                checkText(index, `bullet ${bulletIndex + 1}`, bullet.text);
            });
        } else {
            checkText(index, 'takeaway', slide.takeaway);
            const chart = slide.chart;
            if (!isMissingChart(chart)) {
                chart.series.forEach((series) => {
                    series.values.forEach((value, valueIndex) => {
                        if (!isSourced(value)) {
                            add(index, `chart ${series.name}, ${chart.categories[valueIndex]}`, String(value), [value]);
                        }
                    });
                });
            }
        }
    });
    return findings;
};
