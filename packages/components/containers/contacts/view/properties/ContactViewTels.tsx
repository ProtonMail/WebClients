import { c } from 'ttag';

import Copy from '@proton/components/components/button/Copy';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import type { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

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
                    <span className="w-full flex">
                        <a className="mr-2 flex-1 text-ellipsis" href={`tel:${tel.value}`}>
                            {tel.value}
                        </a>
                        <span className=" shrink-0 flex py-1 contact-view-actions h-4">
                            <Copy
                                className="ml-2 py-2 mt-0.5"
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
