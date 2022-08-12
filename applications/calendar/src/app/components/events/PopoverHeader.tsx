import * as React from 'react';

import { classnames } from '@proton/components';

import PopoverCloseButton from './PopoverCloseButton';

interface Props extends React.ComponentPropsWithRef<'header'> {
    children?: React.ReactNode;
    actions?: React.ReactNode;
    onClose: () => void;
}

const PopoverHeader = ({ children, onClose, actions, className, ...rest }: Props) => {
    return (
        <header className={classnames(['eventpopover-header', className])} {...rest}>
            <div className="eventpopover-actions flex flex-justify-end">
                {actions}
                {!!actions && <span className="eventpopover-actions-separator" />}
                <PopoverCloseButton onClose={onClose} />
            </div>
            {children}
        </header>
    );
};

export default PopoverHeader;
