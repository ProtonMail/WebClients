import { ElementType, ReactElement, cloneElement, forwardRef } from 'react';

import { ButtonLike, ButtonLikeShape } from '@proton/atoms';
import { ThemeColorUnion } from '@proton/colors';

import { classnames } from '../../helpers';
import { PolymorphicComponentProps } from '../../helpers/react-polymorphic-box';

interface OwnProps {
    color?: ThemeColorUnion;
    shape?: ButtonLikeShape;
    icon: ReactElement;
    text: string;
    hasRedDot?: boolean;
}

export type TopNavbarListItemButtonProps<E extends ElementType> = PolymorphicComponentProps<E, OwnProps>;

const defaultElement = 'button';

const TopNavbarListItemButtonBase = <E extends ElementType = typeof defaultElement>(
    {
        color = 'weak',
        shape = 'ghost',
        text,
        icon,
        disabled,
        className,
        hasRedDot,
        tabIndex,
        children,
        ...rest
    }: TopNavbarListItemButtonProps<E>,
    ref: typeof rest.ref
) => {
    const isDisabled = disabled;

    return (
        <ButtonLike
            as={defaultElement}
            color={color}
            shape={shape}
            className={classnames([
                'topnav-link inline-flex flex-nowrap flex-align-items-center',
                hasRedDot && 'relative topnav-link--blackfriday',
                className,
            ])}
            disabled={isDisabled}
            tabIndex={isDisabled ? -1 : tabIndex}
            ref={ref}
            {...rest}
        >
            {cloneElement(icon, {
                className: classnames([icon.props.className, 'topnav-icon mr0-5']),
            })}
            <span className="navigation-title">{text}</span>
            {children}
        </ButtonLike>
    );
};

const TopNavbarListItemButton: <E extends ElementType = typeof defaultElement>(
    props: TopNavbarListItemButtonProps<E>
) => ReactElement | null = forwardRef(TopNavbarListItemButtonBase);

export default TopNavbarListItemButton;
