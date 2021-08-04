import { render, fireEvent } from '@testing-library/react';

import Pagination from './Pagination';

describe('Pagination component', () => {
    const total = 100;
    const limit = 10;

    it('should render and setup Pagination properly', () => {
        const mockOnNext = jest.fn();
        const mockOnPrevious = jest.fn();
        const mockOnSelect = jest.fn();
        const { container, getByTitle } = render(
            <Pagination
                onNext={mockOnNext}
                onPrevious={mockOnPrevious}
                onSelect={mockOnSelect}
                page={1}
                total={total}
                limit={limit}
            />
        );
        const previousButtonNode = container.firstChild.querySelector('.previous-button');
        const pageButtonNode = getByTitle('Open pagination');
        const nextButtonNode = container.firstChild.querySelector('.next-button');

        expect(previousButtonNode).not.toBe(null);
        expect(nextButtonNode).not.toBe(null);

        expect(previousButtonNode.getAttribute('disabled')).not.toBe(null);
        fireEvent.click(previousButtonNode);
        expect(mockOnPrevious).toHaveBeenCalledTimes(0);

        expect(nextButtonNode.getAttribute('disabled')).toBe(null);
        fireEvent.click(nextButtonNode);
        expect(mockOnNext).toHaveBeenCalledTimes(1);

        fireEvent.click(pageButtonNode);
        const options = [].slice.call(document.querySelectorAll('body > .dropdown li'));
        expect(options.length).toBe(Math.ceil(total / limit));
        fireEvent.click(document.querySelector('body > .dropdown li:last-child button'));
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('should not render NEXT and PREVIOUS buttons', () => {
        const mockOnSelect = jest.fn();
        const { container } = render(
            <Pagination
                onSelect={mockOnSelect}
                page={1}
                total={total}
                limit={limit}
                hasPrevious={false}
                hasNext={false}
            />
        );
        const previousButtonNode = container.firstChild.querySelector('.previous-button');
        const nextButtonNode = container.firstChild.querySelector('.next-button');

        expect(previousButtonNode).toBe(null);
        expect(nextButtonNode).toBe(null);
    });
});
