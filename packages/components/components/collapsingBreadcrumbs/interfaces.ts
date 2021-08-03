import * as React from 'react';

export interface BreadcrumbInfo
    extends Omit<React.HTMLAttributes<HTMLButtonElement | HTMLLIElement>, 'children' | 'onClick' | 'className'> {
    key: string | number;
    text: string;
    collapsedText?: React.ReactNode;
    noShrink?: boolean;
    highlighted?: boolean;
    onClick?: () => void;
}
