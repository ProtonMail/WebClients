import { fireEvent, render, screen } from '@testing-library/react';

import { parseDeck } from '../../../util/slides/deck';
import { SLIDES_EVAL_FIXTURES } from '../../../util/slides/eval/slidesEvalFixtures';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import { DeckSlide } from './DeckSlide';
import { readDeckSelection, selectWholeField } from './deckSelection';

const laidOutFixture = (id: string) => {
    const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
        return item.id === id;
    })!;
    return layoutDeck(parseDeck(fixture.modelOutput).deck!);
};

const textNode = (text: string | RegExp): Text => {
    return screen.getByText(text).firstChild as Text;
};

const rangeBetween = (start: Text, startOffset: number, end: Text, endOffset: number): Range => {
    const range = document.createRange();
    range.setStart(start, startOffset);
    range.setEnd(end, endOffset);
    return range;
};

describe('readDeckSelection', () => {
    it('names the bullet a selection inside it comes from', () => {
        const deck = laidOutFixture('northwind-q3');
        render(<DeckSlide slide={deck.slides[1]!} width={480} />);
        const line = textNode('Customer satisfaction (NPS) rose from 41 to 47');

        const parts = readDeckSelection(rangeBetween(line, 28, line, 46));

        expect(parts).toEqual([
            {
                slide: 2,
                field: 'bullet',
                bullet: expect.any(Number),
                text: 'Customer satisfaction (NPS) rose from 41 to 47',
                selected: 'rose from 41 to 47',
            },
        ]);
    });

    it('reads a selection across fields as one part per field, without the bullet glyphs', () => {
        const deck = laidOutFixture('northwind-q3');
        render(<DeckSlide slide={deck.slides[1]!} width={480} />);
        const title = textNode('Highlights');
        const bullet = textNode('Customer satisfaction (NPS) rose from 41 to 47');

        const parts = readDeckSelection(rangeBetween(title, 0, bullet, 8));

        expect(parts[0]).toMatchObject({ slide: 2, field: 'title', text: 'Highlights', selected: 'Highlights' });
        expect(parts[parts.length - 1]).toMatchObject({ field: 'bullet', selected: 'Customer' });
        for (const part of parts) {
            expect(part.selected).not.toContain('•');
        }
    });

    it('names the column of a two-column bullet, numbered within that column', () => {
        const deck = layoutDeck(
            parseDeck({
                title: 'Plans',
                slides: [
                    { layout: 'two-column', title: 'Compare', left: ['Cheap', 'Slow'], right: ['Pricey', 'Fast'] },
                ],
            }).deck!
        );
        render(<DeckSlide slide={deck.slides[0]!} width={480} />);
        const left = textNode('Slow');
        const right = textNode('Fast');

        expect(readDeckSelection(rangeBetween(left, 0, left, 4))).toEqual([
            { slide: 1, field: 'left', bullet: 2, text: 'Slow', selected: 'Slow' },
        ]);
        expect(readDeckSelection(rangeBetween(right, 0, right, 4))).toEqual([
            { slide: 1, field: 'right', bullet: 2, text: 'Fast', selected: 'Fast' },
        ]);
    });

    it('names the quote and attribution of a quote slide', () => {
        const deck = layoutDeck(
            parseDeck({
                title: 'Voices',
                slides: [{ layout: 'quote', title: 'Feedback', quote: 'It just works', attribution: 'A customer' }],
            }).deck!
        );
        render(<DeckSlide slide={deck.slides[0]!} width={480} />);
        const quote = textNode(/It just works/);
        const attribution = textNode('A customer');

        expect(readDeckSelection(rangeBetween(quote, 0, quote, quote.length))[0]).toMatchObject({
            slide: 1,
            field: 'quote',
        });
        expect(readDeckSelection(rangeBetween(attribution, 0, attribution, 1))[0]).toMatchObject({
            slide: 1,
            field: 'attribution',
            text: 'A customer',
        });
    });

    it('gives the deck title for a split slide, without its "(n/m)"', () => {
        const deck = laidOutFixture('split-list');
        const second = deck.slides[1]!;
        render(<DeckSlide slide={second} width={480} />);
        const title = textNode(/^Your First Weeks on the Team \(2\//);

        const parts = readDeckSelection(rangeBetween(title, 0, title, 4));

        expect(parts).toEqual([
            { slide: second.sourceSlide + 1, field: 'title', text: 'Your First Weeks on the Team', selected: 'Your' },
        ]);
    });

    it('joins the lines of a wrapped bullet with a space', () => {
        const long =
            'Onboarding now pairs every new starter with a buddy for their first month, which halved the questions sent to the support channel';
        const deck = layoutDeck(
            parseDeck({ title: 'Team', slides: [{ layout: 'bullets', title: 'Onboarding', bullets: [long] }] }).deck!
        );
        const { container } = render(<DeckSlide slide={deck.slides[0]!} width={480} />);
        const wrapped = container.querySelector('[data-deck-field="bullet"]');
        expect(wrapped!.querySelectorAll('[data-deck-line]').length).toBeGreaterThan(1);
        const lines = Array.from(wrapped!.querySelectorAll('[data-deck-line]'));
        const first = lines[0]!.firstChild as Text;
        const last = lines[lines.length - 1]!.firstChild as Text;

        const [part] = readDeckSelection(rangeBetween(first, 0, last, last.length));

        expect(part!.selected).toBe(part!.text);
    });

    it('finds nothing to edit in a selection outside the deck text', () => {
        const { container } = render(<span>Slide 1</span>);

        const range = document.createRange();
        range.selectNodeContents(container);

        expect(readDeckSelection(range)).toEqual([]);
    });

    describe('selectWholeField', () => {
        afterEach(() => {
            window.getSelection()!.removeAllRanges();
        });

        it('selects the whole "Data needed" box on a click, as the deck\'s "missing" text', () => {
            const deck = laidOutFixture('missing-data');
            const slide = deck.slides[2]!;
            render(<DeckSlide slide={slide} width={480} selectable />);

            fireEvent.mouseUp(screen.getByText(/Data needed: market size figures/));
            const parts = readDeckSelection(window.getSelection()!.getRangeAt(0));

            expect(parts).toHaveLength(1);
            expect(parts[0]).toMatchObject({ slide: slide.sourceSlide + 1, field: 'missingData' });
            expect(parts[0]!.text).not.toContain('Data needed');
            expect(parts[0]!.selected).toContain('market size figures');
        });

        it('leaves a selection the user already made', () => {
            const deck = laidOutFixture('missing-data');
            render(<DeckSlide slide={deck.slides[2]!} width={480} selectable />);
            const line = textNode(/Data needed: market size figures/);
            window.getSelection()!.addRange(rangeBetween(line, 0, line, 11));

            fireEvent.mouseUp(line.parentElement!);

            expect(window.getSelection()!.toString()).toBe('Data needed');
        });

        it('does nothing on Library cards', () => {
            const deck = laidOutFixture('missing-data');
            render(<DeckSlide slide={deck.slides[2]!} width={480} />);

            fireEvent.mouseUp(screen.getByText(/Data needed: market size figures/));

            expect(window.getSelection()!.isCollapsed).toBe(true);
        });

        it('selects all of a field it is put on directly, such as the notes', () => {
            render(
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <span
                    data-deck-slide={0}
                    data-deck-field="notes"
                    data-deck-text="Pause here"
                    onMouseUp={selectWholeField}
                >
                    Pause here
                </span>
            );

            fireEvent.mouseUp(screen.getByText('Pause here'));

            expect(readDeckSelection(window.getSelection()!.getRangeAt(0))).toEqual([
                { slide: 1, field: 'notes', text: 'Pause here', selected: 'Pause here' },
            ]);
        });
    });
});
