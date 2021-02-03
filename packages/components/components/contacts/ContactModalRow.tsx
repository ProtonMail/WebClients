import React, { forwardRef } from 'react';
import { c } from 'ttag';

import { clearType, getType } from 'proton-shared/lib/contacts/property';
import { ContactProperty, ContactPropertyChange } from 'proton-shared/lib/interfaces/contacts';
import { classnames } from '../../helpers';

import { useModals } from '../../hooks';

import ContactFieldProperty from './ContactFieldProperty';
import ContactModalLabel from './ContactModalLabel';
import ContactImageModal from '../../containers/contacts/modals/ContactImageModal';
import Icon from '../icon/Icon';
import { OrderableHandle } from '../orderable';
import DropdownActions from '../dropdown/DropdownActions';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';

interface Props {
    property: ContactProperty;
    onChange: (payload: ContactPropertyChange) => void;
    onRemove: (value: string) => void;
    isOrderable?: boolean;
    isSubmitted?: boolean;
}

const ContactModalRow = forwardRef<HTMLInputElement, Props>(
    ({ property, onChange, onRemove, isOrderable = false, isSubmitted = false }: Props, ref) => {
        const { isNarrow } = useActiveBreakpoint();
        const { createModal } = useModals();
        const { field, uid, value } = property;
        const type = clearType(getType(property.type));
        const isImage = ['photo', 'logo'].includes(field);
        const canDelete = !['fn'].includes(field);
        const canEdit = isImage && !!value;

        const handleChangeImage = () => {
            const handleSubmit = (value: string) => onChange({ uid, value });
            createModal(<ContactImageModal url={property.value as string} onSubmit={handleSubmit} />);
        };

        const list = [];

        if (canEdit) {
            list.push({
                text: isImage ? c('Action').t`Change` : c('Action').t`Edit`,
                onClick: handleChangeImage,
            });
        }
        if (canDelete) {
            list.push({
                text: canEdit ? (
                    <span className="color-global-warning">{c('Action').t`Delete`}</span>
                ) : (
                    <Icon name="trash" className="color-global-warning mauto" alt={c('Action').t`Delete`} />
                ),
                onClick: () => {
                    if (property.uid) {
                        onRemove(property.uid);
                    }
                },
            });
        }

        return (
            <div className="flex flex-nowrap flex-item-noshrink">
                {isOrderable ? (
                    <OrderableHandle key="icon">
                        <div className="cursor-row-resize mr0-5 flex flex-item-noshrink mb1">
                            <Icon name="text-justify" className="mt0-75 on-mobile-mt2" />
                        </div>
                    </OrderableHandle>
                ) : (
                    <div className="mr0-5 flex flex-align-items-center flex-item-noshrink">
                        <Icon name="text-justify visibility-hidden" />
                    </div>
                )}
                <div className="flex flex-nowrap on-mobile-flex-column w95 flex-align-items-start">
                    {field && !(isNarrow && field === 'fn') && (
                        <span
                            className={classnames([
                                'w30 contact-modal-select flex flex-nowrap mb1 flex-align-items-start on-mobile-mb0-5 on-mobile-flex-align-self-start',
                                field === 'fn' && 'pt0-5',
                            ])}
                        >
                            <ContactModalLabel field={field} type={type} uid={property.uid} onChange={onChange} />
                        </span>
                    )}
                    <div className="flex flex-nowrap flex-align-items-start flex-item-noshrink">
                        <span className="flex-item-fluid mb1">
                            <div className="pr1 w100 on-mobile-pr0-5">
                                <ContactFieldProperty
                                    ref={ref}
                                    field={field}
                                    value={property.value}
                                    uid={property.uid}
                                    onChange={onChange}
                                    isSubmitted={isSubmitted}
                                />
                            </div>
                        </span>
                        <span className="mb1">
                            <div className="min-w3e">
                                {list.length > 0 && (
                                    <div className="flex flex-item-noshrink flex-align-items-start">
                                        <DropdownActions className="button--for-icon" list={list} />
                                    </div>
                                )}
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        );
    }
);

export default ContactModalRow;
