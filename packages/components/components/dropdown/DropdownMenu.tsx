import { Children, ComponentPropsWithoutRef, Ref, isValidElement } from 'react';

import clsx from '@proton/utils/clsx';

interface DropdownMenuProps extends ComponentPropsWithoutRef<'ul'> {
    listRef?: Ref<HTMLUListElement>;
}

const DropdownMenu = ({ children, className = '', listRef, ...rest }: DropdownMenuProps) => {
    return (
        <ul className={clsx(['unstyled my-0', className])} ref={listRef} {...rest}>
            {Children.toArray(children).map((child, i) => {
                return isValidElement(child) ? (
                    <li
                        className={clsx([
                            'dropdown-item',
                            child.props.actionType === 'delete' && 'dropdown-item--delete',
                            child.props.liClassName,
                        ])}
                        key={child.key || i}
                    >
                        {child}
                    </li>
                ) : null;
            })}
        </ul>
    );
};

export default DropdownMenu;
