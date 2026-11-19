import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { tabbable } from '../../components/focus/tabbableWrapper';
import { SIDEBAR_SELECTOR } from './constants';

const focus = (element: Element | null | undefined) => {
    if (!(element instanceof HTMLElement)) {
        return false;
    }
    element.focus();
    return document.activeElement === element;
};

/**
 * Moves focus back to the sidebar, on the item of the current page.
 * Falls back to the first item of the sidebar, or to the button that opens the sidebar when it is collapsed.
 */
export const focusSidebar = () => {
    const sidebar = document.querySelector(SIDEBAR_SELECTOR);
    if (!sidebar) {
        return;
    }
    // Collapsed on small screens: its items can't be focused, open it with the navigation button instead
    if (getComputedStyle(sidebar).visibility === 'hidden') {
        focus(document.querySelector('.hamburger[aria-expanded="false"]'));
        return;
    }
    // The last match is the most specific one when parent pages are also marked as current
    const currentItems = sidebar.querySelectorAll('[aria-current="page"]');
    if (focus(currentItems[currentItems.length - 1])) {
        return;
    }
    focus(tabbable(sidebar)[0]);
};

interface Props {
    className?: string;
}

/**
 * Hidden until focused. Placed right before the page title, which receives focus when a page
 * is opened from the sidebar, so keyboard users get back to the sidebar with Shift+Tab then Enter.
 */
const BackToMenuButton = ({ className }: Props) => (
    <button type="button" className={clsx('sr-only sr-only-focusable', className)} onClick={focusSidebar}>
        {c('Action').t`Back to menu`}
    </button>
);

export default BackToMenuButton;
