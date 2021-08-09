import React from 'react';

interface Props {
    imageProps?: React.ComponentPropsWithRef<'img'>;
    children: React.ReactNode;
}

const EmptyViewContainer = ({ imageProps, children }: Props) => {
    return (
        <div className="mauto p1">
            <figure className="flex-item-fluid text-center p3">
                {imageProps && <img className="hauto" {...imageProps} alt={imageProps.alt || ''} />}
                <figcaption className="mt2">{children}</figcaption>
            </figure>
        </div>
    );
};

export default EmptyViewContainer;
