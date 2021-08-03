import { Ref } from 'react';
import * as React from 'react';
import { classnames } from '../../helpers';

interface DropdownMenuProps extends React.ComponentPropsWithoutRef<'ul'> {
    listRef?: Ref<HTMLUListElement>;
}

const DropdownMenu = ({ children, className = '', listRef, ...rest }: DropdownMenuProps) => {
    return (
        <ul className={classnames(['unstyled mt0 mb0', className])} ref={listRef} {...rest}>
            {React.Children.toArray(children).map((child, i) => {
                return React.isValidElement(child) ? (
                    <li
                        className={classnames([
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
