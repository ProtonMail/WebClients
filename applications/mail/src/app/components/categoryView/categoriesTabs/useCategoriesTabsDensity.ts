import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';

/**
 * How much room the category tabs get: `roomy` and `default` differ only in spacing, `compact`
 * drops the labels. What is needed depends on the enabled categories, the translation and each
 * unread count, so it cannot be a media query and has to be measured.
 *
 * Candidates are tried widest first, which keeps the result monotonic: widening the bar can never
 * take a label away.
 */
export type TabsDensity = 'roomy' | 'default' | 'compact';

const DENSITIES: TabsDensity[] = ['roomy', 'default', 'compact'];

const CLASSES: Record<TabsDensity, string> = {
    roomy: 'tabs-roomy',
    default: '',
    compact: 'tabs-compact',
};

const applyDensity = (bar: HTMLElement, density: TabsDensity) => {
    DENSITIES.forEach((candidate) => {
        const className = CLASSES[candidate];

        if (className) {
            bar.classList.toggle(className, candidate === density);
        }
    });
};

export const useCategoriesTabsDensity = (barRef: RefObject<HTMLElement>, tabs: CategoryTab[]) => {
    const [density, setDensity] = useState<TabsDensity>('default');

    // The tabs array is a new reference on every render, only its content matters here.
    const tabIds = tabs.map((tab) => tab.id).join();

    useLayoutEffect(() => {
        const bar = barRef.current;
        if (!bar) {
            return;
        }

        let frame: number;

        // An ellipsised tab measures at its clipped width, so the hidden part is read back from the
        // ghost, which stays laid out in every density precisely so this stays measurable.
        const fullWidth = (wrapper: HTMLElement) => {
            const ghost = wrapper.querySelector<HTMLElement>('.tab-label-ghost');
            const truncated = ghost ? ghost.scrollWidth - ghost.clientWidth : 0;

            return wrapper.getBoundingClientRect().width + truncated;
        };

        // Writing a candidate and reading it back in the same frame forces a synchronous layout but
        // never paints, so no intermediate density is shown. `compact` always fits, never measured.
        const getDensity = (): TabsDensity => {
            for (const candidate of DENSITIES) {
                if (candidate === 'compact') {
                    break;
                }

                applyDensity(bar, candidate);

                const wrappers = [...bar.querySelectorAll<HTMLElement>('.tab-wrapper')];
                const needed = wrappers.reduce((total, wrapper) => total + fullWidth(wrapper), 0);

                const { paddingInlineStart, paddingInlineEnd } = getComputedStyle(bar);
                const available = bar.clientWidth - parseFloat(paddingInlineStart) - parseFloat(paddingInlineEnd);

                // One pixel of slack per tab, sub-pixel rounding alone must not cost a density.
                if (needed - available <= wrappers.length) {
                    return candidate;
                }
            }

            return 'compact';
        };

        const measure = () => {
            const next = getDensity();

            // Leave the DOM on the density we settled on rather than the last one measured, until
            // the render `setDensity` schedules rewrites the class list.
            applyDensity(bar, next);
            setDensity(next);
        };

        // Measuring inside the callback would resize the bar and loop.
        const observer = new ResizeObserver(() => {
            frame = requestAnimationFrame(measure);
        });

        // Tabs are observed too: a counter or a longer translation changes what is needed without
        // the bar itself ever resizing.
        observer.observe(bar);
        bar.querySelectorAll('.tab-wrapper').forEach((tab) => observer.observe(tab));

        measure();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [barRef, tabIds]);

    return density;
};
