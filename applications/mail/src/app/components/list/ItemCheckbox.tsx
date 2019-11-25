import React from 'react';
import { Icon, classnames } from 'react-components';

interface Props {
    children: JSX.Element;
    className: string;
}

const ItemCheckbox = ({ children, className, ...rest }: Props) => {
    return (
        <label className={classnames(['relative', className])}>
            <input type="checkbox" className="item-checkbox inner-ratio-container cursor-pointer m0" {...rest} />
            <span className="item-icon flex-item-noshrink rounded50 bg-white inline-flex">
                <span className="mauto item-abbr">{children}</span>
                <span className="item-icon-fakecheck mauto">
                    <Icon name="on" className="fill-white" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
