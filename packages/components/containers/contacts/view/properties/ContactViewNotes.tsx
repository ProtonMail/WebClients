import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { VCardContact, VCardDateOrText, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

import { ContactViewProperties } from './ContactViewProperties';
import ContactViewProperty from './ContactViewProperty';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
}

const ContactViewNotes = ({ vCardContact, isSignatureVerified = false }: Props) => {
    const notes: VCardProperty<VCardDateOrText>[] = getSortedProperties(vCardContact, 'note');

    if (notes.length === 0) {
        return null;
    }

    return (
        <ContactViewProperties>
            {notes.map((note, i) => {
                const { value } = note;

                return (
                    <ContactViewProperty
                        // I have nothing better for the key there
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        field="note"
                        type={note.params?.type}
                        isSignatureVerified={isSignatureVerified}
                    >
                        <span className="mr-2 flex-1">{value}</span>
                    </ContactViewProperty>
                );
            })}
        </ContactViewProperties>
    );
};

export default ContactViewNotes;
