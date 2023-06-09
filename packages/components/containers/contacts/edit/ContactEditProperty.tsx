import { Ref, forwardRef } from 'react';

import { c } from 'ttag';

import { ContactEmail, ContactEmailModel } from '@proton/shared/lib/interfaces/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import clsx from '@proton/utils/clsx';

import { DropdownActions, Icon, OrderableHandle } from '../../../components';
import ContactGroupDropdown from '../ContactGroupDropdown';
import { ContactGroupEditProps } from '../group/ContactGroupEditModal';
import { ContactGroupLimitReachedProps } from '../modals/ContactGroupLimitReachedModal';
import { ContactImageProps } from '../modals/ContactImageModal';
import ContactEditLabel from './ContactEditLabel';
import ContactFieldProperty from './fields/ContactFieldProperty';

interface Props {
    vCardProperty: VCardProperty;
    onChangeVCard: (vCardProperty: VCardProperty) => void;
    onRemove: (value: string) => void;
    sortable?: boolean;
    isSubmitted?: boolean;
    actionRow?: boolean;
    mainItem?: boolean;
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
        onChangeVCard,
        onRemove,
        sortable = false,
        isSubmitted = false,
        actionRow = true,
        mainItem = false,
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

    return (
        <div className="flex flex-nowrap flex-item-noshrink" data-contact-property-id={vCardProperty.uid}>
            {sortable ? (
                <OrderableHandle key="icon">
                    <div className="cursor-row-resize mr-2 flex flex-item-noshrink mb-4">
                        <Icon name="text-align-justify" className="mt-3 " />
                    </div>
                </OrderableHandle>
            ) : (
                <div className="mr-2 flex flex-align-items-center flex-item-noshrink">
                    <Icon name="text-align-justify" className="visibility-hidden" />
                </div>
            )}
            <div className="contact-modal-field relative flex flex-nowrap on-mobile-flex-column w100 flex-align-items-start">
                <span
                    className={clsx([
                        'contact-modal-select flex flex-nowrap mb-2 md:mb-4 flex-align-items-start on-mobile-flex-align-self-start',
                        mainItem && 'text-semibold',
                        labelWidthClassName || 'w30',
                    ])}
                >
                    <ContactEditLabel
                        vCardProperty={vCardProperty}
                        onChangeVCard={onChangeVCard}
                        fixedType={fixedType}
                        filteredTypes={filteredTypes}
                    />
                </span>

                <div className="flex flex-nowrap flex-align-items-startoupas flex-item-fluid flex-item-noshrink">
                    <span className="flex-item-fluid mb-4">
                        <ContactFieldProperty
                            ref={ref}
                            vCardProperty={vCardProperty}
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
                                        'flex flex-item-noshrink',
                                        field,
                                        (field === 'photo' ||
                                            field === 'note' ||
                                            field === 'logo' ||
                                            field === 'adr') &&
                                            'flex-align-items-start',
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
