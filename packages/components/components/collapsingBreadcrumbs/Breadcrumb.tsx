import { forwardRef, LiHTMLAttributes, Ref, ReactNode } from 'react';
import { classnames } from '../../helpers';
import { Button } from '../button';

interface Props extends Omit<LiHTMLAttributes<HTMLLIElement>, 'onClick'> {
    title?: string;
    children: ReactNode;
    active?: boolean;
    noShrink?: boolean;
    onClick?: () => void;
}

const Breadcrumb = (
    { title, children, onClick, active, noShrink, className, ...rest }: Props,
    ref: Ref<HTMLLIElement>
) => {
    const textClass = classnames([
        'text-pre p0-25 m0 text-ellipsis no-pointer-events-children',
        active ? 'text-strong' : 'color-weak',
    ]);
    return (
        <li
            {...rest}
            ref={ref}
            className={classnames(['collapsing-breadcrumb', noShrink && 'collapsing-breadcrumb--no-shrink', className])}
        >
            {onClick ? (
                <Button shape="ghost" color="weak" title={title} onClick={onClick} className={textClass}>
                    {children}
                </Button>
            ) : (
                <span title={title} className={textClass}>
                    {children}
                </span>
            )}
        </li>
    );
};

export default forwardRef<HTMLLIElement, Props>(Breadcrumb);
