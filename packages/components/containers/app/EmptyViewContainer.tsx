import React, { ComponentPropsWithRef, ReactNode } from 'react';

interface Props extends ComponentPropsWithRef<'div'> {
    imageProps?: ComponentPropsWithRef<'img'>;
    children: ReactNode;
}

const EmptyViewContainer = ({ imageProps, children, ...containerProps }: Props) => {
    return (
        <div className="m-auto p-11" {...containerProps}>
            <figure className="flex-1 text-center p-4">
                {imageProps && <img className="h-auto" {...imageProps} alt={imageProps.alt || ''} />}
                <figcaption className="mt-8">{children}</figcaption>
            </figure>
        </div>
    );
};

export default EmptyViewContainer;
