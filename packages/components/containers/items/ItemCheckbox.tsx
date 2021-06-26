import React, { ChangeEvent, MouseEvent } from 'react';
import { DENSITY } from 'proton-shared/lib/constants';
import { getInitials } from 'proton-shared/lib/helpers/string';
import { useUserSettings } from '../../hooks';
import { Checkbox, Icon } from '../../components';
import { classnames } from '../../helpers';

interface Props {
    ID?: string;
    name?: string;
    compactClassName?: string;
    normalClassName?: string;
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const ItemCheckbox = ({ ID = '', name = '', compactClassName, normalClassName, checked, onChange }: Props) => {
    const [userSettings, loading] = useUserSettings();

    if (loading) {
        return null;
    }

    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    const handleClick = (event: MouseEvent) => {
        event.stopPropagation();
    };

    return isCompactView ? (
        <Checkbox
            className={classnames(['item-icon-compact', compactClassName])}
            checked={checked}
            onChange={onChange}
            labelOnClick={handleClick}
            data-item-id={ID}
            aria-describedby={ID}
            data-testid="item-checkbox"
        />
    ) : (
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        <label className={classnames(['item-checkbox-label relative', normalClassName])} onClick={handleClick}>
            <input
                type="checkbox"
                className="item-checkbox inner-ratio-container cursor-pointer m0"
                checked={checked}
                onChange={onChange}
                data-item-id={ID}
                data-testid="item-checkbox"
            />
            <span
                className="item-icon flex-item-noshrink relative rounded inline-flex"
                data-test-id="element-list:message-checkbox"
            >
                <span className="mauto item-abbr">{getInitials(name)}</span>
                <span className="item-icon-fakecheck mauto">
                    <Icon name="on" className="item-icon-fakecheck-icon" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
