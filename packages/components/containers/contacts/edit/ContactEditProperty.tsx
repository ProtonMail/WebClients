import type { Ref } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import Icon from '@proton/components/components/icon/Icon';
import OrderableHandle from '@proton/components/components/orderable/OrderableHandle';
import type { ContactEmail, ContactEmailModel } from '@proton/shared/lib/interfaces/contacts';
import type { VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import clsx from '@proton/utils/clsx';

import ContactGroupDropdown from '../ContactGroupDropdown';
import type { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import type { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import type { ContactImageProps } from '../modals/ContactImageModal';
import ContactEditLabel from './ContactEditLabel';
import ContactFieldProperty from './fields/ContactFieldProperty';

interface Props {
    vCardProperty: VCardProperty;
    vCardContact: VCardContact;
    onChangeVCard: (vCardProperty: VCardProperty) => void;
    onRemove: (value: string) => void;
    sortable?: boolean;
    isSubmitted?: boolean;
    actionRow?: boolean;
    fixedType?: boolean;
    labelWidthClassName?: string;
    filteredTypes?: string[];
    contactEmail?: ContactEmailModel;
    onContactEmailChange?: (contactEmail: ContactEmailModel) => void;
    onUpgrade: () => void;
    onSelectImage: (props: ContactImageProps) => void;
    onGroupEdit: (props: ContactGroupEditProps) => void;
    onLimitReached?: (props: ContactGroupLimitReachedProps) => void;
}

const ContactEditProperty = (
    {
        vCardProperty,
        vCardContact,
        onChangeVCard,
        onRemove,
        sortable = false,
        isSubmitted = false,
        actionRow = true,
        labelWidthClassName,
        fixedType,
        filteredTypes,
        contactEmail,
        onContactEmailChange,
        onUpgrade,
        onSelectImage,
        onGroupEdit,
        onLimitReached,
    }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const { field, value } = vCardProperty;
    const canDelete = !(field === 'photo' && !value);

    const list = [];

    // Delete is always available (except when primary and no image). Primary name has action row disabled.
    if (canDelete) {
        list.push({
            color: 'weak',
            shape: 'outline',
            text: <Icon name="trash" className="m-auto" alt={c('Action').t`Delete`} />,
            onClick: () => {
                if (vCardProperty.uid) {
                    onRemove(vCardProperty.uid);
                }
            },
        });
    }

    const handleUpdateContactGroups = (changes: { [groupID: string]: boolean }) => {
        if (contactEmail && onContactEmailChange) {
            let LabelIDs = [...contactEmail.LabelIDs];
            Object.entries(changes).forEach(([groupID, checked]) => {
                if (checked) {
                    LabelIDs.push(groupID);
                } else {
                    LabelIDs = contactEmail.LabelIDs.filter((id: string) => id !== groupID);
                }
            });
            onContactEmailChange({ ...contactEmail, LabelIDs, changes: { ...contactEmail.changes, ...changes } });
        }
    };

    // The data-contact-property-id is used to focus on the element in ContactEditProperties
    return (
        <div className="flex flex-nowrap shrink-0" data-contact-property-id={vCardProperty.uid}>
            {sortable ? (
                <OrderableHandle key="icon">
                    <div className="cursor-row-resize mr-2 flex shrink-0 mb-4 mt-0.5">
                        <Icon name="text-align-justify" className="mt-2" />
                    </div>
                </OrderableHandle>
            ) : (
                <div className="mr-2 flex items-center shrink-0">
                    <Icon name="text-align-justify" className="visibility-hidden" />
                </div>
            )}
            <div className="contact-modal-field relative flex flex-nowrap flex-column md:flex-row w-full items-stretch md:items-start">
                <span
                    className={clsx([
                        'contact-modal-select flex flex-nowrap mb-2 md:mb-4 items-start',
                        labelWidthClassName || 'md:w-3/10',
                    ])}
                >
                    <ContactEditLabel
                        vCardProperty={vCardProperty}
                        onChangeVCard={onChangeVCard}
                        fixedType={fixedType}
                        filteredTypes={filteredTypes}
                    />
                </span>

                <div className="flex flex-nowrap items-startoupas md:flex-1 shrink-0">
                    <span className="flex-1 mb-4">
                        <ContactFieldProperty
                            ref={ref}
                            vCardProperty={vCardProperty}
                            vCardContact={vCardContact}
                            onChangeVCard={onChangeVCard}
                            isSubmitted={isSubmitted}
                            onSelectImage={onSelectImage}
                        />
                    </span>
                    {actionRow && (
                        <span className="mb-4 ml-2 flex">
                            {list.length > 0 && (
                                <div
                                    className={clsx([
                                        'flex shrink-0 h-4',
                                        field,
                                        (field === 'photo' ||
                                            field === 'note' ||
                                            field === 'logo' ||
                                            field === 'adr') &&
                                            'items-start',
                                    ])}
                                >
                                    {field === 'email' && (
                                        <ContactGroupDropdown
                                            icon
                                            color="weak"
                                            shape="outline"
                                            className="mr-2"
                                            contactEmails={[contactEmail as unknown as ContactEmail]}
                                            onDelayedSave={handleUpdateContactGroups}
                                            tooltip={c('Title').t`Contact group`}
                                            onGroupEdit={onGroupEdit}
                                            onLimitReached={onLimitReached}
                                            onUpgrade={onUpgrade}
                                        >
                                            <Icon name="users" alt={c('Action').t`Contact group`} />
                                        </ContactGroupDropdown>
                                    )}
                                    <DropdownActions icon list={list} />
                                </div>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default forwardRef(ContactEditProperty);
