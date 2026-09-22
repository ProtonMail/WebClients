import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { getChartColors, useChartColors } from './theme';

describe('getChartColors', () => {
    afterEach(() => {
        document.body.removeAttribute('style');
    });

    it('resolves colours from the CSS custom properties on the body', () => {
        document.body.style.setProperty('--text-norm', '#111111');
        document.body.style.setProperty('--primary', '#222222');
        document.body.style.setProperty('--signal-danger', '#333333');

        const colors = getChartColors();

        expect(colors.text).toBe('#111111');
        expect(colors.primary).toBe('#222222');
        expect(colors.danger).toBe('#333333');
    });

    it('falls back to legible colours for properties the theme does not define', () => {
        const colors = getChartColors();

        expect(colors.text).toBe('#0c0c14');
        expect(colors.primary).toBe('#6d4aff');
        expect(colors.borderWeak).toBe('#eae7e4');
    });

    it('picks up a theme change without a reload', () => {
        document.body.style.setProperty('--primary', '#aaaaaa');
        expect(getChartColors().primary).toBe('#aaaaaa');

        document.body.style.setProperty('--primary', '#bbbbbb');
        expect(getChartColors().primary).toBe('#bbbbbb');
    });
});

let renders = 0;

const Probe = () => {
    const colors = useChartColors();

    renders++;

    return <span data-testid="primary">{colors.primary}</span>;
};

const primary = () => screen.getByTestId('primary').textContent;

describe('useChartColors', () => {
    beforeEach(() => {
        renders = 0;
    });

    afterEach(() => {
        document.body.removeAttribute('style');
    });

    it('resolves the colours of the active theme', () => {
        document.body.style.setProperty('--primary', '#111111');

        render(<Probe />);

        expect(primary()).toBe('#111111');
    });

    it('falls back for a colour the theme does not define', () => {
        render(<Probe />);

        expect(primary()).toBe('#6d4aff');
    });
    it('has colours during the first render, before any paint', () => {
        vi.stubGlobal('requestAnimationFrame', () => 0);

        document.body.style.setProperty('--primary', '#111111');

        render(<Probe />);

        expect(primary()).toBe('#111111');
        expect(renders).toBe(1);
    });

    it('re-reads after the paint, for a theme that lands after the chart', () => {
        const applyTheme = () => document.body.style.setProperty('--primary', '#111111');

        vi.stubGlobal('requestAnimationFrame', (run: FrameRequestCallback) => {
            applyTheme();
            run(0);

            return 0;
        });

        render(<Probe />);

        expect(primary()).toBe('#111111');
    });

    it('keeps the colours it had when the second read agrees, rather than rendering again', () => {
        render(<Probe />);

        expect(renders).toBe(1);
    });

    it('follows a theme change made after the first paint', async () => {
        render(<Probe />);

        expect(primary()).toBe('#6d4aff');

        document.body.style.setProperty('--primary', '#333333');

        await vi.waitFor(() => {
            expect(primary()).toBe('#333333');
        });
    });
});
