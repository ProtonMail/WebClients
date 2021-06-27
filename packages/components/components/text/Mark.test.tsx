import React from 'react';
import { render } from '@testing-library/react';

import Mark from './Mark';

describe('Mark component', () => {
    const input = `Eh, toi, l'ours mal léché`;
    let container: HTMLElement;
    let nodes: NodeListOf<HTMLElement>;

    beforeEach(() => {
        const result = render(<Mark value="e">{input}</Mark>);
        container = result.container;
        nodes = container.querySelectorAll('mark');
    });

    it('should highlight several matches', () => {
        expect(nodes.length).toBe(3);
    });

    it('should highlight accent and capitalized matches', () => {
        expect(nodes[0].textContent).toBe('E');
        expect(nodes[1].textContent).toBe('é');
        expect(nodes[2].textContent).toBe('é');
    });

    it('should highlight print result properly', () => {
        expect(container.innerHTML).toBe(
            `<mark class="is-light">E</mark>h, toi, l'ours mal l<mark class="is-light">é</mark>ch<mark class="is-light">é</mark>`
        );
    });

    it('should return original children if no match', () => {
        const { container } = render(<Mark value="orage">{input}</Mark>);
        expect(container.innerHTML).toBe(input);
    });

    it('should return original children if value empty', () => {
        const { container } = render(<Mark value="">{input}</Mark>);
        expect(container.innerHTML).toBe(input);
    });

    it('should return original children if children not a string', () => {
        const { container } = render(
            <Mark value="orage">
                <input />
            </Mark>
        );
        expect(container.innerHTML).toBe('<input>');
    });
});
