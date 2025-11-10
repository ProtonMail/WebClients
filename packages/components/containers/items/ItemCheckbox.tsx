import type { ChangeEvent, FocusEventHandler, MouseEventHandler } from 'react';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import ContactImage from '@proton/components/containers/contacts/ContactImage';
import type { IconName } from '@proton/icons/types';
import { DENSITY } from '@proton/shared/lib/constants';
import { toValidHtmlId } from '@proton/shared/lib/dom/toValidHtmlId';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import './ItemCheckbox.scss';

const PROTON_COLORS = [
    { class: 'recipient-color-0', color: '#2E8378' }, // Green-1 (Genoa)
    { class: 'recipient-color-1', color: '#34A48A' }, // Green-2 (Gossamer)
    { class: 'recipient-color-2', color: '#52CD96' }, // Green-3 (Mountain Meadow)
    { class: 'recipient-color-3', color: '#51BE50' }, // Green-4 (Apple)
    { class: 'recipient-color-4', color: '#3F8B8E' }, // Green-5 (Paradiso)
    { class: 'recipient-color-5', color: '#764AC4' }, // Purple-1 (Royal Purple)
    { class: 'recipient-color-6', color: '#9E66FC' }, // Purple-2 (Heliotrope)
    { class: 'recipient-color-7', color: '#9C89FF' }, // Purple-3 (Melrose)
    { class: 'recipient-color-8', color: '#A1439F' }, // Purple-4 (Medium Red Violet)
    { class: 'recipient-color-9', color: '#7B3185' }, // Purple-5 (Ripe Plum)
    { class: 'recipient-color-10', color: '#495EA9' }, // Blue-1 (Bay of Many)
    { class: 'recipient-color-11', color: '#4E7ABB' }, // Blue-2 (Cobalt)
    { class: 'recipient-color-12', color: '#4989FF' }, // Blue-3 (Dodger Blue)
    { class: 'recipient-color-13', color: '#3FB0D9' }, // Blue-4 (Picton Blue)
    { class: 'recipient-color-14', color: '#4F66DF' }, // Blue-5 (Royal Blue)
];

const getProtonColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const c = name.charCodeAt(i);
        hash = (c + ((hash << 5) - hash)) % 65537;
    }
    const index = hash % PROTON_COLORS.length;
    return PROTON_COLORS[index].class;
};

interface Props {
    ID?: string;
    name?: string;
    email?: string;
    iconName?: IconName;
    color?: string;
    compactClassName?: string;
    normalClassName?: string;
    bimiSelector?: string;
    displaySenderImage?: boolean;
    checked: boolean;
    variant?: 'default' | 'small';
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const ItemCheckbox = ({
    ID = '',
    name = '',
    email = '',
    iconName,
    color,
    compactClassName,
    normalClassName,
    checked,
    bimiSelector,
    displaySenderImage,
    variant = 'default',
    onChange = () => {},
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

    const isAvatarColorEnabled = useFlag('AvatarColorWeb');

    const bgColorRecipient = color || (isAvatarColorEnabled && getProtonColor(name)); // color is used by contact groups

    return isCompactView ? (
        <Checkbox
            className={clsx(['item-icon-compact', compactClassName])}
            checked={checked}
            onChange={onChange}
            labelOnClick={handleClick}
            data-item-id={ID}
            aria-describedby={toValidHtmlId(`message-subject-${ID}`)}
            data-testid="item-checkbox"
        />
    ) : (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/label-has-associated-control, jsx-a11y/click-events-have-key-events
        <label
            className={clsx(['item-checkbox-label relative', normalClassName])}
            onClick={handleClick}
            onFocus={handleFocus}
        >
            <input
                type="checkbox"
                className="item-checkbox absolute inset-0 cursor-pointer m-0"
                checked={checked}
                onChange={onChange}
                data-item-id={ID}
                aria-describedby={toValidHtmlId(`message-subject-${ID}`)}
                data-testid="item-checkbox"
            />
            <span
                className={clsx(
                    'item-icon shrink-0 relative rounded inline-flex',
                    variant === 'small' && 'item-icon--small',
                    bgColorRecipient
                )}
                style={{
                    backgroundColor: color ?? '',
                }}
                data-testid="element-list:message-checkbox"
                aria-hidden="true"
            >
                <span className="m-auto item-abbr rounded overflow-hidden" aria-hidden="true">
                    {iconName ? (
                        <Icon name={iconName} color="white" />
                    ) : (
                        <ContactImage
                            email={email}
                            name={name}
                            bimiSelector={bimiSelector}
                            displaySenderImage={displaySenderImage}
                            className="rounded relative"
                        />
                    )}
                </span>
                <span className="item-icon-fakecheck m-auto">
                    <Icon color={color ? 'white' : undefined} name="checkmark" className="item-icon-fakecheck-icon" />
                </span>
            </span>
        </label>
    );
};

export default ItemCheckbox;
