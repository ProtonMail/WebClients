import type { Ref } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import { OTHER_INFORMATION_FIELDS } from '@proton/shared/lib/contacts/constants';
import {
    compareVCardPropertyByPref,
    compareVCardPropertyByUid,
    getSortedProperties,
    getVCardProperties,
} from '@proton/shared/lib/contacts/properties';
import { EXACTLY_ONE_MAY_BE_PRESENT, PROPERTIES } from '@proton/shared/lib/contacts/vcard';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { ContactEmailModel } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import isTruthy from '@proton/utils/isTruthy';
import move from '@proton/utils/move';

import { OrderableContainer, OrderableElement } from '../../../components';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import type { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import type { ContactImageProps } from '../modals/ContactImageModal';
import EncryptedIcon from '../view/EncryptedIcon';
import ContactEditProperty from './ContactEditProperty';

const ICONS: { [key: string]: IconName } = {
    fn: 'user',
    email: 'envelope',
    tel: 'phone',
    adr: 'map-pin',
    bday: 'candles-cake',
    note: 'note',
    other: 'info-circle',
};

interface Props {
    field?: string;
    isSignatureVerified: boolean;
    sortable?: boolean;
    onAdd?: () => void;
    onRemove: (value: string) => void;
    isSubmitted?: boolean;
    contactEmails?: SimpleMap<ContactEmailModel>;
    onContactEmailChange?: (contactEmail: ContactEmailModel) => void;
    vCardContact: VCardContact;
    onChangeVCard: (vCardProperty: VCardProperty) => void;
    onUpgrade: () => void;
    onSelectImage: (props: ContactImageProps) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onLimitReached?: (props: ContactGroupLimitReachedProps) => void;
}

const ContactEditProperties = (
    {
        isSignatureVerified,
        field,
        sortable: inputSortable = false,
        onAdd,
        onRemove,
        isSubmitted = false,
        contactEmails,
        onContactEmailChange,
        vCardContact,
        onChangeVCard,
        onUpgrade,
        onSelectImage,
        onGroupEdit,
        onLimitReached,
    }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const TITLES: { [key: string]: string } = {
        fn: c('Title').t`Other names`,
        email: c('Title').t`Email addresses`,
        tel: c('Title').t`Phone numbers`,
        adr: c('Title').t`Addresses`,
        bday: c('Title').t`Birthday`,
        note: c('Title').t`Notes`,
        other: c('Title').t`Other information`,
    };

    const title = field ? TITLES[field] : TITLES.other;
    const iconName = field ? ICONS[field] : ICONS.other;
    const fields = field ? [field] : OTHER_INFORMATION_FIELDS;
    const excluded = [
        getSortedProperties(vCardContact, 'fn')[0]?.uid,
        getSortedProperties(vCardContact, 'photo')[0]?.uid,
        getSortedProperties(vCardContact, 'geo')[0]?.uid,
    ];
    const properties: VCardProperty[] = getVCardProperties(vCardContact)
        .filter(({ field }) => fields.includes(field))
        .filter(({ uid }) => !excluded.includes(uid))
        .sort((a, b) => {
            if (fields.length === 1) {
                return compareVCardPropertyByPref(a, b);
            }
            return compareVCardPropertyByUid(a, b);
        });
    const sortable = inputSortable && properties.length > 1;

    // Only allow adding a property if there are no properties or if the field is not fn or bday
    const canAdd = properties.length === 0 || !['fn', 'bday'].includes(field || '');

    const rows = useMemo(() => {
        const isOtherFields = fields === OTHER_INFORMATION_FIELDS;
        const filteredTypes = isOtherFields
            ? properties
                  .filter(({ field }) => PROPERTIES[field].cardinality === EXACTLY_ONE_MAY_BE_PRESENT)
                  .map(({ field }) => field)
            : [];

        return properties.map((property) => (
            <ContactEditProperty
                key={property.uid}
                vCardContact={vCardContact}
                ref={ref}
                isSubmitted={isSubmitted}
                onRemove={onRemove}
                sortable={sortable}
                filteredTypes={
                    // Accept the currently set type
                    filteredTypes.filter((type) => property.field !== type)
                }
                contactEmail={contactEmails?.[property.value as string]}
                onContactEmailChange={onContactEmailChange}
                vCardProperty={property}
                onChangeVCard={onChangeVCard}
                onUpgrade={onUpgrade}
                onSelectImage={onSelectImage}
                onGroupEdit={onGroupEdit}
                onLimitReached={onLimitReached}
            />
        ));
    }, [properties, vCardContact, onChangeVCard, onRemove, onAdd, sortable]);

    const handleSortEnd = useCallback(
        ({ newIndex, oldIndex }: { newIndex: number; oldIndex: number }) => {
            const orderedProperties = move(properties, oldIndex, newIndex);
            orderedProperties.forEach((property, index) => {
                onChangeVCard({ ...property, params: { ...property.params, pref: String(index + 1) } });
            });
        },
        [properties, field]
    );

    // In most cases, (other) name section will be empty, and we don't want to display it
    // if it is empty because the main name is always displayed at the top of the modal
    // only used for exceptions - old records imported with multiple names
    if (field === 'fn' && !properties.length) {
        return null;
    }

    const handleAdd = () => {
        if (!canAdd || !onAdd) {
            return;
        }

        // Other fields (at the bottom of the form) don't have fields and can be added at anytime
        if (!field) {
            onAdd();
            return;
        }

        const vcardPropertyField: any = vCardContact[field as keyof VCardContact];
        const presentData = vcardPropertyField?.map((item: any) => item.value).filter(isTruthy);

        // We add a field if all the fields are filled, or there is no data yet
        if (rows?.length === presentData?.length || !presentData) {
            onAdd();
            return;
        }

        // We find the first empty row and focus on it, the row can be an input or a textarea
        const firstEmptyRow = vcardPropertyField?.findIndex((field: any) => {
            // Address field are objects and not a string, we need to make sure that all the values are empty
            if (field.field === 'adr') {
                return Object.values(field.value).every((value: any) => !value);
            }

            return !field.value;
        });

        if (firstEmptyRow === -1) {
            return;
        }

        // We didn't use ref here because the ref is not available for the child rows
        const contactFieldToFocus = document.querySelector(
            `[data-contact-property-id="${vcardPropertyField[firstEmptyRow]?.uid}"]`
        );

        const input = contactFieldToFocus?.getElementsByTagName('input')?.[0];
        if (input) {
            input.focus();
            return;
        }

        const textarea = contactFieldToFocus?.getElementsByTagName('textarea')?.[0];
        if (textarea) {
            textarea.focus();
            return;
        }
    };

    return (
        <div className="border-bottom mb-4" data-testid={title}>
            <h3 className="mb-4 flex flex-nowrap items-center shrink-0">
                <Icon className="mr-1 shrink-0" name={iconName} />
                <span className="ml-0.5 mr-2">{title}</span>
                {((field && !['fn', 'email'].includes(field)) || field === undefined) && (
                    <EncryptedIcon
                        className="flex self-center my-auto shrink-0"
                        isSignatureVerified={isSignatureVerified}
                    />
                )}
            </h3>
            {field && ['email'].includes(field) && (
                <span className="text-semibold ml-5 pl-1 mb-2">{c('Info').t`Primary`}</span>
            )}
            {sortable ? (
                <OrderableContainer helperClass="z-modals bg-norm color-norm" onSortEnd={handleSortEnd} useDragHandle>
                    <div className="mt-2">
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
                <div className="flex flex-nowrap shrink-0">
                    <div className="mr-2 flex items-center shrink-0">
                        <Icon name="text-align-justify" className="visibility-hidden" />
                    </div>
                    <div className="flex flex-nowrap w-custom" style={{ '--w-custom': '95%' }}>
                        <Button
                            color="weak"
                            shape="outline"
                            size="small"
                            className="mb-4"
                            onClick={handleAdd}
                            data-testid={field ? `add-${field}` : 'add-other'}
                        >
                            {c('Action').t`Add`}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default forwardRef(ContactEditProperties);
