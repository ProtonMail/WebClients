import { forwardRef, Ref } from 'react';
import { c } from 'ttag';
import { ContactEmail, ContactEmailModel } from '@proton/shared/lib/interfaces/contacts';
import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { Button, DropdownActions, Icon, Tooltip, OrderableHandle } from '../../../components';
import { classnames } from '../../../helpers';
import { useUser } from '../../../hooks';
import ContactEditLabel from './ContactEditLabel';
import ContactFieldProperty from './fields/ContactFieldProperty';
import ContactGroupDropdown from '../ContactGroupDropdown';

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
    }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const { field, value } = vCardProperty;
    const canDelete = !(field === 'photo' && !value);
    const [{ hasPaidMail }] = useUser();

    const list = [];

    // Delete is always available (except when primary and no image). Primary name has action row disabled.
    if (canDelete) {
        list.push({
            color: 'weak',
            shape: 'outline',
            text: <Icon name="trash" className="mauto" alt={c('Action').t`Delete`} />,
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
                    <ContactEditLabel
                        vCardProperty={vCardProperty}
                        onChangeVCard={onChangeVCard}
                        fixedType={fixedType}
                        filteredTypes={filteredTypes}
                    />
                </span>

                <div className="flex flex-nowrap flex-align-items-startoupas flex-item-fluid flex-item-noshrink">
                    <span className="flex-item-fluid mb1">
                        <ContactFieldProperty
                            ref={ref}
                            vCardProperty={vCardProperty}
                            onChangeVCard={onChangeVCard}
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
                                                <Button icon onClick={onUpgrade} className="mr0-5">
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

export default forwardRef(ContactEditProperty);
