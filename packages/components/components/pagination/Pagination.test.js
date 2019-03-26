import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import Pagination from './Pagination';

describe('Pagination component', () => {
    it('should render and setup Pagination properly', () => {
        const mockOnNext = jest.fn();
        const mockOnPrevious = jest.fn();
        const mockOnSelect = jest.fn();
        const total = 100;
        const limit = 10;
        const { container } = render(
            <Pagination
                onNext={mockOnNext}
                onPrevious={mockOnPrevious}
                onSelect={mockOnSelect}
                page={1}
                total={total}
                limit={limit}
            />
        );
        const previousButtonNode = container.firstChild.querySelector(
            '.pm-group-buttons > .pm-group-button:first-child'
        );
        const pageButtonNode = container.firstChild.querySelector('.dropDown .pm-group-button');
        const nextButtonNode = container.firstChild.querySelector('.pm-group-buttons > .pm-group-button:last-child');

        expect(previousButtonNode).not.toBe(null);
        expect(nextButtonNode).not.toBe(null);

        expect(previousButtonNode.getAttribute('disabled')).not.toBe(null);
        fireEvent.click(previousButtonNode);
        expect(mockOnPrevious).toHaveBeenCalledTimes(0);

        expect(nextButtonNode.getAttribute('disabled')).toBe(null);
        fireEvent.click(nextButtonNode);
        expect(mockOnNext).toHaveBeenCalledTimes(1);

        fireEvent.click(pageButtonNode);
        const options = [].slice.call(container.querySelectorAll('li'));
        expect(options.length).toBe(Math.ceil(total / limit));
        fireEvent.click(container.querySelector('li:last-child button'));
        expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
});
