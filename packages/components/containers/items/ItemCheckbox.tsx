import { ChangeEvent, MouseEvent } from 'react';

import { DENSITY } from '@proton/shared/lib/constants';

import { Checkbox, Icon } from '../../components';
import { classnames } from '../../helpers';
import { useUserSettings } from '../../hooks';
import { ContactImage } from '../contacts';

interface Props {
    ID?: string;
    name?: string;
    email?: string;
    compactClassName?: string;
    normalClassName?: string;
    bimiSelector?: string;
    checked: boolean;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const ItemCheckbox = ({
    ID = '',
    name = '',
    email = '',
    compactClassName,
    normalClassName,
    checked,
    bimiSelector,
    onChange,
}: Props) => {
    const [userSettings] = useUserSettings();
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
                data-testid="element-list:message-checkbox"
            >
                <span className="mauto item-abbr" aria-hidden="true">
                    <ContactImage email={email} name={name} bimiSelector={bimiSelector} className="rounded" />
                </span>
                <span className="item-icon-fakecheck mauto">
                    <Icon name="checkmark" className="item-icon-fakecheck-icon" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
