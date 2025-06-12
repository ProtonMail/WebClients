import type { ComponentPropsWithRef, PropsWithChildren, ReactNode } from 'react';

import { EmptyViewContainer } from '@proton/components';

interface Props extends PropsWithChildren {
    imgProps?: ComponentPropsWithRef<'img'>;
    height: number;
    title: string;
    description: string | ReactNode;
}

export const EmptyViewWrapper = ({ imgProps, height, title, description, children }: Props) => {
    return (
        <EmptyViewContainer imageProps={imgProps} height={height}>
            <h3 className="h3 text-bold text-lg color-weak" data-testid="empty-view-placeholder--empty-title">
                {title}
            </h3>
            <p className="mt-2 mb-0 text-rg color-weak" data-testid="empty-view-placeholder--empty-description">
                {description}
            </p>
            {children}
        </EmptyViewContainer>
    );
};
