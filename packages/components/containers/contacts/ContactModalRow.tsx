import { forwardRef, Ref, useEffect, useRef } from 'react';
import { c } from 'ttag';
import { clearType, getType } from '@proton/shared/lib/contacts/property';
import {
    ContactEmail,
    ContactEmailModel,
    ContactProperty,
    ContactPropertyChange,
} from '@proton/shared/lib/interfaces/contacts';

import { Button, DropdownActions, Icon, Tooltip, OrderableHandle } from '../../components';
import { classnames } from '../../helpers';
import { useModals, useUser } from '../../hooks';
import ContactModalLabel from './ContactModalLabel';
import ContactFieldProperty from './ContactFieldProperty';
import ContactGroupDropdown from './ContactGroupDropdown';
import ContactUpgradeModal from './ContactUpgradeModal';

interface Props {
    property: ContactProperty;
    onChange: (payload: ContactPropertyChange) => void;
    onRemove: (value: string) => void;
    isOrderable?: boolean;
    isSubmitted?: boolean;
    actionRow?: boolean;
    mainItem?: boolean;
    fixedType?: boolean;
    labelWidthClassName?: string;
    filteredTypes?: string[];
    contactEmail?: ContactEmailModel;
    onContactEmailChange?: (contactEmail: ContactEmailModel) => void;
}

const ContactModalRow = (
    {
        property,
        onChange,
        onRemove,
        isOrderable = false,
        isSubmitted = false,
        actionRow = true,
        mainItem = false,
        labelWidthClassName,
        fixedType,
        filteredTypes,
        contactEmail,
        onContactEmailChange,
    }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const { field, value } = property;
    const type = clearType(getType(property.type));
    const canDelete = !(field === 'photo' && !value);
    const [{ hasPaidMail }] = useUser();
    const { createModal } = useModals();
    const prevField = useRef<string>();
    const fieldsToReset = ['bday', 'anniversary', 'photo', 'logo'];

    const list = [];

    // Delete is always available (except when primary and no image). Primary name has action row disabled.
    if (canDelete) {
        list.push({
            color: 'weak',
            shape: 'outline',
            text: <Icon name="trash" className="mauto" alt={c('Action').t`Delete`} />,
            onClick: () => {
                if (property.uid) {
                    onRemove(property.uid);
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

    useEffect(() => {
        // Skip if it's initialization
        if (prevField.current) {
            // Reset the value if coming from Birthday/Anniversary/Photo/Logo input
            if (field !== prevField.current && fieldsToReset.includes(prevField.current)) {
                onChange({ ...property, value: '' });
            }

            // Reset the value if going to Birthday/Anniversary/Photo/Logo input
            if (fieldsToReset.includes(field)) {
                onChange({ ...property, value: '' });
            }
        }

        prevField.current = field;
    }, [field]);

    return (
        <div className="flex flex-nowrap flex-item-noshrink" data-contact-property-id={property.uid}>
            {isOrderable ? (
                <OrderableHandle key="icon">
                    <div className="cursor-row-resize mr0-5 flex flex-item-noshrink mb1">
                        <Icon name="text-align-justify" className="mt0-75 " />
                    </div>
                </OrderableHandle>
            ) : (
                <div className="mr0-5 flex flex-align-items-center flex-item-noshrink">
                    <Icon name="text-align-justify" className="visibility-hidden" />
                </div>
            )}
            <div className="contact-modal-field relative flex flex-nowrap on-mobile-flex-column w100 flex-align-items-start">
                <span
                    className={classnames([
                        'contact-modal-select flex flex-nowrap mb1 flex-align-items-start on-mobile-mb0-5 on-mobile-flex-align-self-start',
                        mainItem && 'text-semibold',
                        labelWidthClassName || 'w30',
                    ])}
                >
                    <ContactModalLabel
                        field={field}
                        type={type}
                        uid={property.uid}
                        onChange={onChange}
                        fixedType={fixedType}
                        filteredTypes={filteredTypes}
                    />
                </span>

                <div className="flex flex-nowrap flex-align-items-startoupas flex-item-fluid flex-item-noshrink">
                    <span className="flex-item-fluid mb1">
                        <ContactFieldProperty
                            ref={ref}
                            field={field}
                            value={property.value}
                            uid={property.uid}
                            onChange={onChange}
                            isSubmitted={isSubmitted}
                        />
                    </span>
                    {actionRow && (
                        <span className="mb1 flex ml0-5">
                            {list.length > 0 && (
                                <div
                                    className={classnames([
                                        'flex flex-item-noshrink',
                                        field,
                                        Array.isArray(property.value) ? property.value.join(' ') : property.value,
                                        (field === 'photo' ||
                                            field === 'note' ||
                                            field === 'logo' ||
                                            field === 'adr') &&
                                            'flex-align-items-start',
                                    ])}
                                >
                                    {field === 'email' &&
                                        (hasPaidMail ? (
                                            <ContactGroupDropdown
                                                icon
                                                color="weak"
                                                shape="outline"
                                                className="mr0-5"
                                                contactEmails={
                                                    (contactEmail ? [contactEmail] : []) as any as ContactEmail[]
                                                }
                                                onDelayedSave={handleUpdateContactGroups}
                                                tooltip={c('Title').t`Contact group`}
                                            >
                                                <Icon name="users" alt={c('Action').t`Contact group`} />
                                            </ContactGroupDropdown>
                                        ) : (
                                            <Tooltip title={c('Title').t`Contact group`}>
                                                <Button
                                                    icon
                                                    onClick={() => createModal(<ContactUpgradeModal />)}
                                                    className="mr0-5"
                                                >
                                                    <Icon name="users" alt={c('Action').t`Contact group`} />
                                                </Button>
                                            </Tooltip>
                                        ))}
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

export default forwardRef(ContactModalRow);
