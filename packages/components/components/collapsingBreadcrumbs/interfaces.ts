import { HTMLAttributes, ReactNode } from 'react';

export interface BreadcrumbInfo
    extends Omit<HTMLAttributes<HTMLButtonElement | HTMLLIElement>, 'children' | 'onClick'> {
    key: string | number;
    text: string;
    richText?: ReactNode;
    collapsedText?: ReactNode;
    noShrink?: boolean;
    highlighted?: boolean;
    onClick?: () => void;
}
