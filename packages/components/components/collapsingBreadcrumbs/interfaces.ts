import { HTMLAttributes, ReactNode } from 'react';

export interface BreadcrumbInfo
    extends Omit<HTMLAttributes<HTMLButtonElement | HTMLLIElement>, 'children' | 'onClick' | 'className'> {
    key: string | number;
    text: string;
    richText?: ReactNode;
    collapsedText?: ReactNode;
    noShrink?: boolean;
    highlighted?: boolean;
    className?: string;
    onClick?: () => void;
}
