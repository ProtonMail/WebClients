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
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        <label className={classnames(['relative stop-propagation', className])}>
            <input type="checkbox" className="item-checkbox inner-ratio-container cursor-pointer m0" {...rest} />
            <span className="item-icon flex-item-noshrink relative rounded50 inline-flex">
                <span className="mauto item-abbr">{children}</span>
                <span className="item-icon-fakecheck mauto">
                    <Icon name="on" className="item-icon-fakecheck-icon" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
