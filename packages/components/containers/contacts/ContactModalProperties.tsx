import React, { useCallback, useMemo, forwardRef, Ref } from 'react';
import { c } from 'ttag';

import { move } from 'proton-shared/lib/helpers/array';
import { OTHER_INFORMATION_FIELDS } from 'proton-shared/lib/contacts/constants';
import { ContactPropertyChange, ContactProperties } from 'proton-shared/lib/interfaces/contacts';

import { EXACTLY_ONE_MAY_BE_PRESENT, PROPERTIES } from 'proton-shared/lib/contacts/vcard';
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
    fn: c('Title').t`Other names`,
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

const ContactModalProperties = (
    { properties: allProperties, field, onChange, onOrderChange, onAdd, onRemove, isSubmitted = false }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const title = field ? TITLES[field] : TITLES.other;
    const iconName = field ? ICONS[field] : ICONS.other;
    const fields = field ? [field] : OTHER_INFORMATION_FIELDS;
    const properties = allProperties.filter(({ field }) => fields.includes(field));
    const canAdd = !fields.includes('fn');
    const rows = useMemo(() => {
        const isOtherFields = fields === OTHER_INFORMATION_FIELDS;
        const filteredTypes = isOtherFields
            ? properties
                  .filter((property) => PROPERTIES[property.field].cardinality === EXACTLY_ONE_MAY_BE_PRESENT)
                  .map((property) => property.field)
            : [];

        return properties.map((property) => (
            <ContactModalRow
                key={property.uid}
                ref={ref}
                isSubmitted={isSubmitted}
                property={property}
                onChange={onChange}
                onRemove={onRemove}
                isOrderable={!!onOrderChange}
                filteredTypes={
                    // Accept the currently set type
                    filteredTypes.filter((type) => property.field !== type)
                }
            />
        ));
    }, [properties, onChange, onRemove, onAdd, !!onOrderChange]);

    const handleSortEnd = useCallback(
        ({ newIndex, oldIndex }) => {
            const orderedProperties = move(properties, oldIndex, newIndex);
            if (onOrderChange && field) {
                onOrderChange(field, orderedProperties);
            }
        },
        [properties, field]
    );

    // In most cases, (other) name section will be empty, and we don't want to display it
    // if it is empty because the main name is always displayed at the top of the modal
    // only used for exceptions - old records imported with multiple names
    if (field === 'fn' && !properties.length) {
        return null;
    }

    return (
        <div className="border-bottom mb1">
            <h3 className="mb1 flex flex-nowrap flex-align-items-center flex-item-noshrink">
                <Icon className="mr0-25 flex-item-noshrink" name={iconName} />
                <span className="ml0-1 mr0-5">{title}</span>
                {((field && !['fn', 'email'].includes(field)) || field === undefined) && (
                    <EncryptedIcon className="flex flex-item-centered-vert flex-item-noshrink" />
                )}
            </h3>
            {field && ['email'].includes(field) && (
                <span className="text-semibold ml1-5 pl0-25 mb0-5">{c('Info').t`Primary`}</span>
            )}
            {onOrderChange ? (
                <OrderableContainer helperClass="row--orderable" onSortEnd={handleSortEnd} useDragHandle>
                    <div className="mt0-5">
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
                    <div className="mr0-5 flex flex-align-items-center flex-item-noshrink">
                        <Icon name="text-justify visibility-hidden" />
                    </div>
                    <div className="flex flex-nowrap w95">
                        <Button color="norm" shape="outline" className="mb1" onClick={onAdd}>{c('Action')
                            .t`Add`}</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default forwardRef(ContactModalProperties);
