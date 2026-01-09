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

    it('should render price with PLN in suffix', () => {
        const { container } = render(<Price currency="PLN">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('15 zł');
    });

    it('should render negative price with PLN in suffix', () => {
        const { container } = render(<Price currency="PLN">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-15 zł');
    });

    it('should render price with HKD in prefix', () => {
        const { container } = render(<Price currency="HKD">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('HK$15');
    });

    it('should render negative price with HKD in prefix', () => {
        const { container } = render(<Price currency="HKD">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-HK$15');
    });

    it('should render price with JPY in prefix', () => {
        const { container } = render(<Price currency="JPY">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('¥1500');
    });

    it('should render negative price with JPY in prefix', () => {
        const { container } = render(<Price currency="JPY">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-¥1500');
    });

    it('should render price with KRW in prefix', () => {
        const { container } = render(<Price currency="KRW">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('₩1500');
    });

    it('should render negative price with KRW in prefix', () => {
        const { container } = render(<Price currency="KRW">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-₩1500');
    });

    it('should render price with SGD in prefix', () => {
        const { container } = render(<Price currency="SGD">{1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('SGD 15');
    });

    it('should render negative price with SGD in prefix', () => {
        const { container } = render(<Price currency="SGD">{-1500}</Price>);
        expect((container.firstChild as any).textContent).toBe('-SGD 15');
    });
});
