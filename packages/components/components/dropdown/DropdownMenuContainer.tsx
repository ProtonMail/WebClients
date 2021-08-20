import { forwardRef, ReactNode, Ref } from 'react';
import { classnames } from '../../helpers';
import DropdownMenuButton, { Props as DropdownMenuButtonProps } from './DropdownMenuButton';

export interface Props extends DropdownMenuButtonProps {
    buttonContent?: ReactNode;
    extraContent?: ReactNode;
    buttonRef?: Ref<HTMLButtonElement>;
    className?: string;
    buttonClassName?: string;
}

const DropdownMenuContainer = (
    { buttonContent, extraContent, buttonRef, className, buttonClassName, ...rest }: Props,
    ref: Ref<HTMLDivElement>
) => {
    return (
        <div
            ref={ref}
            className={classnames([
                'dropdown-item-container flex flex-justify-space-between flex-nowrap relative',
                className,
            ])}
        >
            <DropdownMenuButton
                ref={buttonRef}
                className={classnames(['increase-click-surface', buttonClassName])}
                {...rest}
            >
                {buttonContent}
            </DropdownMenuButton>
            {extraContent || null}
        </div>
    );
};

export default forwardRef(DropdownMenuContainer);
