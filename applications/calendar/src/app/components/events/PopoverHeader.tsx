import * as React from 'react';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import PopoverCloseButton from './PopoverCloseButton';

interface Props extends React.ComponentPropsWithRef<'header'> {
    children?: React.ReactNode;
    actions?: React.ReactNode;
    onClose: () => void;
    isDraggable?: boolean;
}

const PopoverHeader = ({ children, onClose, actions, className, isDraggable = false, ...rest }: Props) => {
    return (
        <header className={clsx(['eventpopover-header', className])} {...rest}>
            <div className="eventpopover-actions flex justify-end">
                {isDraggable && <Icon name="dots" className="mr-auto my-auto color-weak" />}
                {actions}
                {!!actions && <span className="eventpopover-actions-separator" />}
                <PopoverCloseButton onClose={onClose} />
            </div>
            {children}
        </header>
    );
};

export default PopoverHeader;
