import { c } from 'ttag';

import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { Copy } from '../../../../components';
import { useNotifications } from '../../../../hooks';
import { ContactViewProperties } from './ContactViewProperties';
import ContactViewProperty from './ContactViewProperty';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
}

const ContactViewTels = ({ vCardContact, isSignatureVerified = false }: Props) => {
    const { createNotification } = useNotifications();

    const tels = getSortedProperties(vCardContact, 'tel');

    if (tels.length === 0) {
        return null;
    }

    return (
        <ContactViewProperties>
            {tels.map((tel, i) => (
                <ContactViewProperty
                    // I have nothing better for the key there
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    field="tel"
                    type={tel.params?.type}
                    isSignatureVerified={isSignatureVerified}
                >
                    <span className="w100 flex">
                        <a className="mr0-5 flex-item-fluid text-ellipsis" href={`tel:${tel.value}`}>
                            {tel.value}
                        </a>
                        <span className=" flex-item-noshrink flex py0-25 pr0-25 contact-view-actions">
                            <Copy
                                className="ml0-5 pt0-5 pb0-5 mt0-1"
                                value={tel.value}
                                onCopy={() => {
                                    createNotification({ text: c('Success').t`Phone number copied to clipboard` });
                                }}
                            />
                        </span>
                    </span>
                </ContactViewProperty>
            ))}
        </ContactViewProperties>
    );
};

export default ContactViewTels;
