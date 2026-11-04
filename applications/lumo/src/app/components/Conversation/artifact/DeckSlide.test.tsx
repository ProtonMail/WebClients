import { render, screen } from '@testing-library/react';

import { parseDeck } from '../../../util/slides/deck';
import { SLIDES_EVAL_FIXTURES } from '../../../util/slides/eval/slidesEvalFixtures';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import { DeckChart } from './DeckChart';
import { DeckChecks } from './DeckChecks';
import { DeckSlide } from './DeckSlide';

const laidOutFixture = (id: string) => {
    const fixture = SLIDES_EVAL_FIXTURES.find((item) => {
        return item.id === id;
    })!;
    return layoutDeck(parseDeck(fixture.modelOutput).deck!);
};

describe('DeckSlide', () => {
    it('draws the slide text as plain text, line by line as the layout wrapped it', () => {
        const deck = laidOutFixture('northwind-q3');
        render(<DeckSlide slide={deck.slides[1]!} width={480} />);

        expect(screen.getByText('Highlights')).toBeInTheDocument();
        expect(screen.getByText('Customer satisfaction (NPS) rose from 41 to 47')).toBeInTheDocument();
    });

    it('shows a missing chart as a "Data needed" box', () => {
        const deck = laidOutFixture('missing-data');
        render(<DeckSlide slide={deck.slides[2]!} width={480} />);

        expect(screen.getByText(/Data needed: market size figures/)).toBeInTheDocument();
    });
});

describe('DeckChart', () => {
    it('draws a negative bar down from the zero line instead of hiding it', () => {
        const { container } = render(
            <DeckChart
                chart={{ kind: 'bar', categories: ['North', 'South'], series: [{ name: 'Q3', values: [12, -5] }] }}
                width={600}
                height={300}
            />
        );
        const [positive, negative] = Array.from(container.querySelectorAll('rect'));
        const positiveTop = Number(positive!.getAttribute('y'));
        const positiveBottom = positiveTop + Number(positive!.getAttribute('height'));

        expect(Number(negative!.getAttribute('height'))).toBeGreaterThan(0);
        // Both bars meet at zero: the positive one ends there, the negative one starts there.
        expect(Number(negative!.getAttribute('y'))).toBeCloseTo(positiveBottom);
        expect(screen.getByText('-5')).toBeInTheDocument();
    });

    it('draws repeated category and series names without React key warnings', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <DeckChart
                chart={{
                    kind: 'bar',
                    categories: ['Other', 'Other'],
                    series: [
                        { name: 'Sales', values: [1, 2] },
                        { name: 'Sales', values: [3, 4] },
                    ],
                }}
                width={600}
                height={300}
            />
        );

        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });
});

describe('DeckChecks', () => {
    it('lists unsourced and calculated numbers separately, and missing information', () => {
        render(
            <DeckChecks
                findings={[
                    { sourceSlide: 0, where: 'takeaway', value: '104' },
                    { sourceSlide: 0, where: 'bullet 1', value: '123', calculatedAs: 'Average of the weekdays' },
                ]}
                gaps={['Market size numbers']}
                slideNumberFor={(sourceSlide) => {
                    return sourceSlide + 1;
                }}
            />
        );

        expect(
            screen.getByText("1 number isn't in your messages, files or web results. Check it before you share.")
        ).toBeInTheDocument();
        expect(screen.getByText('1 number was calculated from your material.')).toBeInTheDocument();
        expect(screen.getByText('Market size numbers')).toBeInTheDocument();
    });

    it('shows nothing when every number is sourced and nothing is missing', () => {
        const { container } = render(
            <DeckChecks
                findings={[]}
                gaps={[]}
                slideNumberFor={() => {
                    return 1;
                }}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });
});
