import { render } from '@testing-library/react';

import Mark from './Mark';

describe('Mark component', () => {
    const input = `Eh, toi, l'ours mal léché`;

    it('should highlight several matches', () => {
        const result = render(<Mark value="e">{input}</Mark>);
        const container = result.container;
        const nodes = container.querySelectorAll('mark');
        expect(nodes.length).toBe(3);
    });

    it('should highlight accent and capitalized matches', () => {
        const result = render(<Mark value="e">{input}</Mark>);
        const container = result.container;
        const nodes = container.querySelectorAll('mark');
        expect(nodes[0].textContent).toBe('E');
        expect(nodes[1].textContent).toBe('é');
        expect(nodes[2].textContent).toBe('é');
    });

    it('should highlight print result properly', () => {
        const result = render(<Mark value="e">{input}</Mark>);
        const container = result.container;
        expect(container.innerHTML).toBe(
            `<mark class="is-light">E</mark><span>h, toi, l'ours mal l</span><mark class="is-light">é</mark><span>ch</span><mark class="is-light">é</mark>`
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

    it('should preserve spacing between highlighted matches', () => {
        const text = 'Créer un nouveau dossier';
        const { container } = render(<Mark value="n">{text}</Mark>);
        expect(container.innerHTML).toBe(
            `<span>Créer u</span><mark class="is-light">n</mark><span> </span><mark class="is-light">n</mark><span>ouveau dossier</span>`
        );
    });
});
