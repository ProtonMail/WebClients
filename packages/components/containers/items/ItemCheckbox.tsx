import { ChangeEvent, FocusEventHandler, MouseEventHandler } from 'react';

import { DENSITY } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { Checkbox, Icon } from '../../components';
import { useUserSettings } from '../../hooks';
import { ContactImage } from '../contacts';

interface Props {
    ID?: string;
    name?: string;
    email?: string;
    compactClassName?: string;
    normalClassName?: string;
    bimiSelector?: string;
    displaySenderImage?: boolean;
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
    displaySenderImage,
    onChange,
}: Props) => {
    const [userSettings] = useUserSettings();
    const isCompactView = userSettings.Density === DENSITY.COMPACT;

    /**
     * Due to the way we handle focus of parent elements
     * we need to stop propagation of click and focus
     * on checkbox label.
     */
    const handleClick: MouseEventHandler<HTMLLabelElement> = (event) => event.stopPropagation();
    const handleFocus: FocusEventHandler<HTMLLabelElement> = (event) => event.stopPropagation();

    return isCompactView ? (
        <Checkbox
            className={clsx(['item-icon-compact', compactClassName])}
            checked={checked}
            onChange={onChange}
            labelOnClick={handleClick}
            data-item-id={ID}
            aria-describedby={ID}
            data-testid="item-checkbox"
        />
    ) : (
        <label
            className={clsx(['item-checkbox-label relative', normalClassName])}
            onClick={handleClick}
            onFocus={handleFocus}
        >
            <input
                type="checkbox"
                className="item-checkbox inner-ratio-container cursor-pointer m-0"
                checked={checked}
                onChange={onChange}
                data-item-id={ID}
                data-testid="item-checkbox"
            />
            <span
                className="item-icon flex-item-noshrink relative rounded inline-flex"
                data-testid="element-list:message-checkbox"
                aria-hidden="true"
            >
                <span className="m-auto item-abbr rounded no-scroll" aria-hidden="true">
                    <ContactImage
                        email={email}
                        name={name}
                        bimiSelector={bimiSelector}
                        displaySenderImage={displaySenderImage}
                        className="rounded relative"
                    />
                </span>
                <span className="item-icon-fakecheck m-auto">
                    <Icon name="checkmark" className="item-icon-fakecheck-icon" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
