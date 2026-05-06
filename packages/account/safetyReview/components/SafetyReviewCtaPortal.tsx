import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    footerEl: HTMLElement | null;
    children: ReactNode;
}
export const SafetyReviewCtaPortal = ({ footerEl, children }: Props) => {
    return footerEl && createPortal(children, footerEl, 'safety-review-portal');
};
