import type { ComponentPropsWithRef, ReactNode } from 'react';

interface Props extends ComponentPropsWithRef<'div'> {
    height?: number;
    imageProps?: ComponentPropsWithRef<'img'>;
    children: ReactNode;
}

const EmptyViewContainer = ({ imageProps, children, height, ...containerProps }: Props) => {
    return (
        <div className="m-auto p-11" {...containerProps}>
            <figure className="flex-1 text-center p-4">
                {imageProps && <img className="w-auto" height={height} {...imageProps} alt={imageProps.alt || ''} />}
                <figcaption className="mt-8">{children}</figcaption>
            </figure>
        </div>
    );
};

export default EmptyViewContainer;
