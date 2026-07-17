import type { ReactNode } from 'react';

type HastElement = {
    properties?: {
        className?: string[];
    };
};

export function extractCodeBlockText(children: ReactNode): string {
    if (typeof children === 'string') {
        return children.replace(/\n$/, '');
    }

    if (Array.isArray(children)) {
        return children
            .map((child) => (typeof child === 'string' ? child : ''))
            .join('')
            .replace(/\n$/, '');
    }

    return String(children ?? '').replace(/\n$/, '');
}

export function getCodeBlockLanguage(
    className?: string | string[] | null,
    node?: HastElement
): string {
    const classes = normalizeClassNames(className, node);
    const match = /language-([\w-]+)/.exec(classes);
    return match?.[1]?.toLowerCase() ?? '';
}

function normalizeClassNames(className?: string | string[] | null, node?: HastElement): string {
    if (Array.isArray(className)) {
        return className.join(' ');
    }

    if (typeof className === 'string') {
        return className;
    }

    if (Array.isArray(node?.properties?.className)) {
        return node.properties.className.join(' ');
    }

    return '';
}
