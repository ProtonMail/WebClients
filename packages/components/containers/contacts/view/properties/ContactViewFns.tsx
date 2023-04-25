import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { VCardContact } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ContactViewProperties } from './ContactViewProperties';
import ContactViewProperty from './ContactViewProperty';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
}

const ContactViewFns = ({ vCardContact, isSignatureVerified = false }: Props) => {
    const fns = getSortedProperties(vCardContact, 'fn')
        // First FN is in the summary
        .slice(1);

    if (fns.length === 0) {
        return null;
    }

    return (
        <ContactViewProperties className="mb-4">
            {fns.map((fn, i) => (
                <ContactViewProperty
                    // I have nothing better for the key there
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    field="fn"
                    isSignatureVerified={isSignatureVerified}
                >
                    {fn.value}
                </ContactViewProperty>
            ))}
        </ContactViewProperties>
    );
};

export default ContactViewFns;
