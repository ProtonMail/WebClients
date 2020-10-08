import React, { useCallback, useMemo, forwardRef } from 'react';
import { c } from 'ttag';

import { move } from 'proton-shared/lib/helpers/array';
import { OTHER_INFORMATION_FIELDS } from 'proton-shared/lib/contacts/constants';
import { ContactPropertyChange, ContactProperties } from 'proton-shared/lib/interfaces/contacts';

import { Button, Icon, OrderableContainer, OrderableElement } from '../../components';
import ContactModalRow from '../../components/contacts/ContactModalRow';
import EncryptedIcon from '../../components/contacts/EncryptedIcon';

const ICONS: { [key: string]: string } = {
    fn: 'contact',
    email: 'email',
    tel: 'phone',
    adr: 'address',
    other: 'info',
};

const TITLES: { [key: string]: string } = {
    fn: c('Title').t`Display name`,
    email: c('Title').t`Email addresses`,
    tel: c('Title').t`Phone numbers`,
    adr: c('Title').t`Addresses`,
    other: c('Title').t`Other information`,
};

interface Props {
    field?: string;
    properties: ContactProperties;
    onChange: (payload: ContactPropertyChange) => void;
    onOrderChange?: (field: string, orderedProperties: ContactProperties) => void;
    onAdd?: () => void;
    onRemove: (value: string) => void;
    isSubmitted?: boolean;
}

const ContactModalProperties = forwardRef<HTMLInputElement, Props>(
    (
        { properties: allProperties, field, onChange, onOrderChange, onAdd, onRemove, isSubmitted = false }: Props,
        ref
    ) => {
        const title = field ? TITLES[field] : TITLES.other;
        const iconName = field ? ICONS[field] : ICONS.other;
        const fields = field ? [field] : OTHER_INFORMATION_FIELDS;
        const properties = allProperties.filter(({ field }) => fields.includes(field));
        const canAdd = !fields.includes('fn');
        const rows = useMemo(
            () =>
                properties.map((property) => (
                    <ContactModalRow
                        key={property.uid}
                        ref={ref}
                        isSubmitted={isSubmitted}
                        property={property}
                        onChange={onChange}
                        onRemove={onRemove}
                        isOrderable={!!onOrderChange}
                    />
                )),
            [properties, onChange, onRemove, onAdd, !!onOrderChange]
        );

        const handleSortEnd = useCallback(
            ({ newIndex, oldIndex }) => {
                const orderedProperties = move(properties, oldIndex, newIndex);
                if (onOrderChange && field) {
                    onOrderChange(field, orderedProperties);
                }
            },
            [properties, field]
        );

        return (
            <div className="border-bottom mb1">
                <h3 className="mb1 flex flex-nowrap flex-items-center flex-item-noshrink">
                    <Icon className="mr0-5 flex-item-noshrink" name={iconName} />
                    <span className="mr0-5">{title}</span>
                    {field && !['fn', 'email'].includes(field) && (
                        <EncryptedIcon className="flex flex-item-centered-vert flex-item-noshrink" />
                    )}
                </h3>
                {onOrderChange ? (
                    <OrderableContainer helperClass="row--orderable" onSortEnd={handleSortEnd} useDragHandle>
                        <div>
                            {rows.map((row, index) => (
                                <OrderableElement key={row.key || `row${index}`} index={index}>
                                    {row}
                                </OrderableElement>
                            ))}
                        </div>
                    </OrderableContainer>
                ) : (
                    <div>{rows}</div>
                )}
                {canAdd && (
                    <div className="flex flex-nowrap flex-item-noshrink">
                        <div className="mr0-5 flex flex-items-center flex-item-noshrink">
                            <Icon name="text-justify nonvisible" />
                        </div>
                        <div className="flex flex-nowrap w95">
                            <Button className="pm-button--primaryborder mb1" onClick={onAdd}>{c('Action')
                                .t`Add`}</Button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

export default ContactModalProperties;
