import { getNativeSidebarLayout, readSidebarMetrics } from './sidebarMetrics';

const stubCustomProperties = (values: Record<string, string>) => {
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: (name: string) => values[name] ?? '',
    } as unknown as CSSStyleDeclaration);
};

const metrics = { expandedWidth: 300, transitionMs: 300 };

describe('readSidebarMetrics', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('reads the declared width and duration', () => {
        stubCustomProperties({
            '--lumo-sidebar-expanded-width': '280px',
            '--lumo-sidebar-transition-duration': '250ms',
        });

        expect(readSidebarMetrics()).toEqual({ expandedWidth: 280, transitionMs: 250 });
    });

    it('normalises a duration declared in seconds', () => {
        stubCustomProperties({
            '--lumo-sidebar-expanded-width': '300px',
            '--lumo-sidebar-transition-duration': '0.3s',
        });

        expect(readSidebarMetrics().transitionMs).toBe(300);
    });

    it('falls back when the properties are missing', () => {
        stubCustomProperties({});

        expect(readSidebarMetrics()).toEqual({ expandedWidth: 300, transitionMs: 300 });
    });

    it('falls back when the properties are not numbers', () => {
        stubCustomProperties({
            '--lumo-sidebar-expanded-width': 'auto',
            '--lumo-sidebar-transition-duration': 'ease-in-out',
        });

        expect(readSidebarMetrics()).toEqual({ expandedWidth: 300, transitionMs: 300 });
    });

    it('falls back when the width is declared in a unit other than px', () => {
        stubCustomProperties({
            '--lumo-sidebar-expanded-width': '18.75rem',
            '--lumo-sidebar-transition-duration': '300ms',
        });

        expect(readSidebarMetrics().expandedWidth).toBe(300);
    });

    it('parses an uppercase px unit', () => {
        stubCustomProperties({
            '--lumo-sidebar-expanded-width': '300PX',
            '--lumo-sidebar-transition-duration': '300ms',
        });

        expect(readSidebarMetrics().expandedWidth).toBe(300);
    });

    it('reads an uppercase ms unit as milliseconds, not seconds', () => {
        stubCustomProperties({
            '--lumo-sidebar-expanded-width': '300px',
            '--lumo-sidebar-transition-duration': '300MS',
        });

        expect(readSidebarMetrics().transitionMs).toBe(300);
    });
});

describe('getNativeSidebarLayout', () => {
    it('reports nothing on small screens', () => {
        expect(
            getNativeSidebarLayout({ isSmallScreen: true, isSidebarVisible: true, animate: true, metrics })
        ).toBeNull();
    });

    it('reports the expanded width when the sidebar is visible', () => {
        expect(
            getNativeSidebarLayout({ isSmallScreen: false, isSidebarVisible: true, animate: false, metrics })
        ).toEqual({ width: 300, animationDurationMs: 0 });
    });

    it('reports zero width when the sidebar is collapsed', () => {
        expect(
            getNativeSidebarLayout({ isSmallScreen: false, isSidebarVisible: false, animate: true, metrics })
        ).toEqual({ width: 0, animationDurationMs: 300 });
    });

    it('reports the transition duration only when animating', () => {
        expect(
            getNativeSidebarLayout({ isSmallScreen: false, isSidebarVisible: true, animate: true, metrics })!
                .animationDurationMs
        ).toBe(300);
        expect(
            getNativeSidebarLayout({ isSmallScreen: false, isSidebarVisible: true, animate: false, metrics })!
                .animationDurationMs
        ).toBe(0);
    });
});
