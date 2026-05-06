import { flushSync } from 'react-dom';

import noop from '@proton/utils/noop';

/** Set on `document.documentElement` after the intro view transition */
const SAFETY_REVIEW_VT_INTRO_COMPLETE_ATTR = 'data-safety-review-vt-intro-complete';

export const introTransition = (update: () => void) => {
    const markIntroVtComplete = () => {
        document.documentElement.setAttribute(SAFETY_REVIEW_VT_INTRO_COMPLETE_ATTR, '');
    };

    if ('startViewTransition' in document) {
        void document
            .startViewTransition(() => {
                flushSync(update);
            })
            .finished.finally(() => {
                markIntroVtComplete();
            })
            .catch(noop);
    } else {
        update();
        markIntroVtComplete();
    }
};

export const removeIntroTransition = () => {
    document.documentElement.removeAttribute(SAFETY_REVIEW_VT_INTRO_COMPLETE_ATTR);
};

export const swipeTransition = ({
    type,
    visibleItems,
    update,
}: {
    visibleItems: any[];
    type: 'completed' | 'skipped';
    update: () => void;
}) => {
    if ('startViewTransition' in document) {
        const root = document.documentElement;
        root.dataset.safetyReviewSwipe = type === 'completed' ? 'completed' : 'skipped';
        if (visibleItems.length >= 2) {
            root.dataset.safetyReviewSwipePromote = 'true';
        }

        void document
            .startViewTransition(() => flushSync(update))
            .finished.finally(() => {
                delete root.dataset.safetyReviewSwipe;
                delete root.dataset.safetyReviewSwipePromote;
            })
            .catch(noop);
    } else {
        update();
    }
};
