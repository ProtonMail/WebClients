import type { ComponentPropsWithRef, PropsWithChildren, ReactNode } from 'react';

import { EmptyViewContainer } from '@proton/components/index';

interface Props extends PropsWithChildren {
    imgProps?: ComponentPropsWithRef<'img'>;
    height: number;
    title: string;
    description: string | ReactNode;
}

export const EmptyViewWrapper = ({ imgProps, height, title, description, children }: Props) => {
    return (
        <EmptyViewContainer imageProps={imgProps} height={height}>
            <h3 className="text-bold" data-testid="empty-view-placeholder--empty-title">
                {title}
            </h3>
            <p data-testid="empty-view-placeholder--empty-description">{description}</p>
            {children}
        </EmptyViewContainer>
    );
};
