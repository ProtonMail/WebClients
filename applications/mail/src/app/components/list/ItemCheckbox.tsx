import React, { ReactElement, ChangeEvent } from 'react';
import { Icon, classnames } from 'react-components';

interface Props {
    children: ReactElement | string;
    className: string;
    checked: boolean;
    onChange: (event: ChangeEvent) => void;
}

const ItemCheckbox = ({ children, className, ...rest }: Props) => {
    return (
        <label className={classnames(['relative stop-propagation', className])}>
            <input type="checkbox" className="item-checkbox inner-ratio-container cursor-pointer m0" {...rest} />
            <span className="item-icon flex-item-noshrink rounded50 bg-white inline-flex">
                <span className="mauto item-abbr">{children}</span>
                <span className="item-icon-fakecheck color-white mauto">
                    <Icon name="on" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
