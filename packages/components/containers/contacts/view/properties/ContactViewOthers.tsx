import { format } from 'date-fns';
import { VCardContact, VCardDateOrText, VCardGenderValue } from '@proton/shared/lib/interfaces/contacts/VCard';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { OTHER_INFORMATION_FIELDS } from '@proton/shared/lib/contacts/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import ContactViewProperty from './ContactViewProperty';
import { ContactViewProperties } from './ContactViewProperties';
import { RemoteImage } from '../../../../components';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
}

const ContactViewOthers = ({ vCardContact, isSignatureVerified = false }: Props) => {
    const fields = OTHER_INFORMATION_FIELDS;

    return (
        <ContactViewProperties>
            {fields.map((field) => {
                let properties = getSortedProperties(vCardContact, field);

                // First photo is used in the summary
                if (field === 'photo') {
                    properties = properties.slice(1);
                }

                if (properties.length === 0) {
                    return null;
                }

                return properties.map(({ value }, i) => {
                    const getView = () => {
                        if (field === 'url') {
                            // use new root address when the url does not include the protocol (HTTP or HTTPS)
                            const href = value.startsWith('http') || value.startsWith('//') ? value : `//${value}`;
                            return (
                                <a href={href} target="_blank" rel="noopener noreferrer">
                                    {value}
                                </a>
                            );
                        }
                        if (['bday', 'anniversary'].includes(field)) {
                            const dateOrText = value as VCardDateOrText;
                            if (dateOrText.date) {
                                return format(dateOrText.date, 'PP', { locale: dateLocale });
                            }
                            if (dateOrText.text) {
                                return dateOrText.text;
                            }
                            return value;
                        }
                        if (field === 'gender') {
                            const genderValue = value as VCardGenderValue;
                            return genderValue.text;
                        }
                        if (field === 'logo') {
                            return <RemoteImage src={value} />;
                        }
                        return value;
                    };

                    return (
                        <ContactViewProperty
                            // I have nothing better for the key there
                            // eslint-disable-next-line react/no-array-index-key
                            key={i}
                            field={field}
                            isSignatureVerified={isSignatureVerified}
                        >
                            {getView()}
                        </ContactViewProperty>
                    );
                });
            })}
        </ContactViewProperties>
    );
};

export default ContactViewOthers;
