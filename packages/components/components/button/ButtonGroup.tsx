import {
    Children,
    cloneElement,
    ComponentPropsWithoutRef,
    forwardRef,
    Fragment,
    isValidElement,
    ReactElement,
    ReactNode,
} from 'react';
import { classnames } from '../../helpers';
import { Vr } from '../vr';

export type Color = 'norm' | 'weak' | 'danger' | 'warning' | 'success' | 'info';

export type Shape = 'solid' | 'outline' | 'ghost';

export type Size = 'small' | 'medium' | 'large';

export interface Props extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    color?: Color;
    shape?: Shape;
    size?: Size;
}

const ButtonGroup = forwardRef<HTMLDivElement, Props>(
    ({ children, color = 'weak', shape = 'outline', size = 'medium', className = '', ...rest }, ref) => {
        const childrenWithSeparators = Children.toArray(children)
            .filter((x): x is ReactElement => x !== null && isValidElement(x))
            .map((child, index, array) => {
                const clonedChild = cloneElement(child, { group: true, size });
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
                className={classnames([
                    'button-group',
                    `button-group-${shape}-${color}`,
                    `button-group-${size}`,
                    className,
                ])}
                ref={ref}
                {...rest}
            >
                {childrenWithSeparators}
            </div>
        );
    }
);

export default ButtonGroup;
