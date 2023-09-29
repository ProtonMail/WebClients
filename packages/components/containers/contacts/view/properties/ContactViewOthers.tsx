import { format, isValid } from 'date-fns';

import { OTHER_INFORMATION_FIELDS } from '@proton/shared/lib/contacts/constants';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { dateLocale } from '@proton/shared/lib/i18n';
import { VCardContact, VCardDateOrText, VCardGenderValue } from '@proton/shared/lib/interfaces/contacts/VCard';

import { RemoteImage } from '../../../../components';
import { ContactViewProperties } from './ContactViewProperties';
import ContactViewProperty from './ContactViewProperty';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
}

const ContactViewOthers = ({ vCardContact, isSignatureVerified = false }: Props) => {
    const fields = OTHER_INFORMATION_FIELDS;

    const properties = fields.flatMap((field) => {
        let properties = getSortedProperties(vCardContact, field);

        // First photo is used in the summary
        if (field === 'photo') {
            properties = properties.slice(1);
        }

        return properties;
    });

    if (properties.length === 0) {
        return null;
    }

    return (
        <ContactViewProperties>
            {properties.map(({ field, value }, i) => {
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
                    if (field === 'anniversary') {
                        const dateOrText = value as VCardDateOrText;
                        if (dateOrText.date && isValid(dateOrText.date)) {
                            return format(dateOrText.date, 'PP', { locale: dateLocale });
                        }
                        if (dateOrText.text) {
                            return dateOrText.text;
                        }
                        return null;
                    }
                    if (field === 'gender') {
                        const genderValue = value as VCardGenderValue;
                        return genderValue.text;
                    }
                    if (field === 'logo' || field === 'photo') {
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
            })}
        </ContactViewProperties>
    );
};

export default ContactViewOthers;
