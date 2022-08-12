import { Ref, forwardRef } from 'react';

import { VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ContactImageProps } from '../../modals/ContactImageModal';
import ContactFieldAdr from './ContactFieldAdr';
import ContactFieldDate from './ContactFieldDate';
import ContactFieldEmail from './ContactFieldEmail';
import ContactFieldFn from './ContactFieldFn';
import ContactFieldGender from './ContactFieldGender';
import ContactFieldImage from './ContactFieldImage';
import ContactFieldNote from './ContactFieldNote';
import ContactFieldString from './ContactFieldString';
import ContactFieldTel from './ContactFieldTel';

interface Props {
    vCardProperty: VCardProperty<any>;
    onChangeVCard: (vCardProperty: VCardProperty) => void;
    onSelectImage: (props: ContactImageProps) => void;
    isSubmitted?: boolean;
}

const ContactFieldProperty = (
    { vCardProperty, onChangeVCard, onSelectImage, isSubmitted = false, ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const { field } = vCardProperty;

    if (field === 'email') {
        return <ContactFieldEmail vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
    }

    if (field === 'tel') {
        return <ContactFieldTel vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
    }

    if (field === 'adr') {
        return <ContactFieldAdr vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
    }

    if (field === 'note') {
        return <ContactFieldNote vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
    }

    if (field === 'bday' || field === 'anniversary') {
        return <ContactFieldDate vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
    }

    if (field === 'photo' || field === 'logo') {
        return (
            <ContactFieldImage
                vCardProperty={vCardProperty}
                onChange={onChangeVCard}
                onSelectImage={onSelectImage}
                {...rest}
            />
        );
    }

    if (field === 'fn') {
        return (
            <ContactFieldFn
                ref={ref}
                vCardProperty={vCardProperty}
                onChange={onChangeVCard}
                isSubmitted={isSubmitted}
                {...rest}
            />
        );
    }

    if (field === 'gender') {
        return <ContactFieldGender vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
    }

    return <ContactFieldString vCardProperty={vCardProperty} onChange={onChangeVCard} {...rest} />;
};

export default forwardRef(ContactFieldProperty);
