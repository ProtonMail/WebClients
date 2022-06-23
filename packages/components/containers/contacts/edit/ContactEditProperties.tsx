import { useCallback, useMemo, forwardRef, Ref } from 'react';
import { c } from 'ttag';
import move from '@proton/utils/move';
import { OTHER_INFORMATION_FIELDS } from '@proton/shared/lib/contacts/constants';
import { ContactEmailModel } from '@proton/shared/lib/interfaces/contacts';
import { EXACTLY_ONE_MAY_BE_PRESENT, PROPERTIES } from '@proton/shared/lib/contacts/vcard';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import {
    compareVCardPropertyByPref,
    compareVCardPropertyByUid,
    getSortedProperties,
    getVCardProperties,
} from '@proton/shared/lib/contacts/properties';
import { Button, Icon, IconName, OrderableContainer, OrderableElement } from '../../../components';
import ContactEditProperty from './ContactEditProperty';
import EncryptedIcon from '../view/EncryptedIcon';

const ICONS: { [key: string]: IconName } = {
    fn: 'user',
    email: 'envelope',
    tel: 'phone',
    adr: 'map-pin',
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
}

const ContactEditProperties = (
    {
        isSignatureVerified,
        field,
        sortable = false,
        onAdd,
        onRemove,
        isSubmitted = false,
        contactEmails,
        onContactEmailChange,
        vCardContact,
        onChangeVCard,
        onUpgrade,
    }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const TITLES: { [key: string]: string } = {
        fn: c('Title').t`Other names`,
        email: c('Title').t`Email addresses`,
        tel: c('Title').t`Phone numbers`,
        adr: c('Title').t`Addresses`,
        other: c('Title').t`Other information`,
    };

    const title = field ? TITLES[field] : TITLES.other;
    const iconName = field ? ICONS[field] : ICONS.other;
    const fields = field ? [field] : OTHER_INFORMATION_FIELDS;
    const excluded = [
        getSortedProperties(vCardContact, 'fn')[0]?.uid,
        getSortedProperties(vCardContact, 'photo')[0]?.uid,
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

    const canAdd = !fields.includes('fn');
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
            />
        ));
    }, [properties, vCardContact, onChangeVCard, onRemove, onAdd, sortable]);

    const handleSortEnd = useCallback(
        ({ newIndex, oldIndex }) => {
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

    return (
        <div className="border-bottom mb1">
            <h3 className="mb1 flex flex-nowrap flex-align-items-center flex-item-noshrink">
                <Icon className="mr0-25 flex-item-noshrink" name={iconName} />
                <span className="ml0-1 mr0-5">{title}</span>
                {((field && !['fn', 'email'].includes(field)) || field === undefined) && (
                    <EncryptedIcon
                        className="flex flex-item-centered-vert flex-item-noshrink"
                        isSignatureVerified={isSignatureVerified}
                    />
                )}
            </h3>
            {field && ['email'].includes(field) && (
                <span className="text-semibold ml1-5 pl0-25 mb0-5">{c('Info').t`Primary`}</span>
            )}
            {sortable ? (
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
                        <Icon name="text-align-justify" className="visibility-hidden" />
                    </div>
                    <div className="flex flex-nowrap w95">
                        <Button
                            color="norm"
                            shape="outline"
                            className="mb1"
                            onClick={onAdd}
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
