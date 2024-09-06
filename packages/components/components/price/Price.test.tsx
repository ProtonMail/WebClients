import { render } from '@testing-library/react';

import Price from './Price';

describe('Price component', () => {
    it('should render negative price with USD currency', () => {
        const { container } = render(<Price currency="USD">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-US$15');
    });

    it('should render price with EUR in suffix', () => {
        const { container } = render(<Price currency="EUR">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('15 €');
    });

    it('should render negative price with EUR in suffix', () => {
        const { container } = render(<Price currency="EUR">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-15 €');
    });

    it('should render price with CHF in prefix', () => {
        const { container } = render(<Price currency="CHF">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('CHF 15');
    });

    it('should render negative price with CHF in prefix', () => {
        const { container } = render(<Price currency="CHF">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-CHF 15');
    });

    it('should render price with BRL in prefix', () => {
        const { container } = render(<Price currency="BRL">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('BRL 15');
    });

    it('should render negative price with BRL in prefix', () => {
        const { container } = render(<Price currency="BRL">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-BRL 15');
    });

    it('should use the divisor defined', () => {
        const { container } = render(<Price divisor={1}>{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('1500');
    });

    it('should render string values as is', () => {
        const { container } = render(<Price>{'Let us talk'}</Price>);
        expect((container.firstChild as any).textContent).toBe('Let us talk');
    });

    it('should render value without currencies', () => {
        const { container } = render(<Price>{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('15');
    });
});
