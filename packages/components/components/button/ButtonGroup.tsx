import React, { Fragment, ReactElement } from 'react';
import { classnames } from '../../helpers';
import { Vr } from '../vr';

type Shape = 'outline' | 'ghost';

type Size = 'small' | 'medium' | 'large';

interface Props extends React.ComponentPropsWithoutRef<'div'> {
    children: React.ReactNode;
    shape?: Shape;
    size?: Size;
    className?: string;
}

const ButtonGroup = (
    { children, shape = 'outline', size = 'medium', className = '', ...rest }: Props,
    ref: React.Ref<HTMLDivElement>
) => {
    const childrenWithSeparators = React.Children.toArray(children)
        .filter((x): x is ReactElement => x !== null && React.isValidElement(x))
        .map((child, index, array) => {
            const clonedChild = React.cloneElement(child, { group: true });
            if (index === array.length - 1) {
                return clonedChild;
            }
            return (
                // eslint-disable-next-line react/no-array-index-key
                <Fragment key={clonedChild.key || index}>
                    {clonedChild}
                    <Vr aria-hidden="true" />
                </Fragment>
            );
        });
    return (
        <div
            className={classnames(['button-group', `button-group-${shape}`, `button-group-${size}`, className])}
            ref={ref}
            {...rest}
        >
            {childrenWithSeparators}
        </div>
    );
};

export default React.forwardRef<HTMLDivElement, Props>(ButtonGroup);
