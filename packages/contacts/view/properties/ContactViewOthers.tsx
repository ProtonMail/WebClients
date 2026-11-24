import { format } from 'date-fns';

import RemoteImage from '@proton/components/components/image/RemoteImage';
import { OTHER_INFORMATION_FIELDS } from '@proton/shared/lib/contacts/constants';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { isDateTextValue, isValidDateValue } from '@proton/shared/lib/contacts/vcard';
import { dateLocale } from '@proton/shared/lib/i18n';
import type {
    VCardContact,
    VCardDateOrText,
    VCardGenderValue,
    VCardOrg,
    VCardProperty,
} from '@proton/shared/lib/interfaces/contacts/VCard';
import isTruthy from '@proton/utils/isTruthy';

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

        if (field === 'org') {
            // TODO: move this field to its own `ContactViewOrg` component
            properties = properties.map((property: VCardProperty<VCardOrg>) => ({
                ...property,
                value: [property.value.organizationalName, ...(property.value.organizationalUnitNames ?? [])]
                    .filter(isTruthy)
                    .join('; '),
            }));
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
                        const dateOrText: VCardDateOrText = value;
                        if (isValidDateValue(dateOrText)) {
                            return format(dateOrText.date, 'PP', { locale: dateLocale });
                        }
                        if (isDateTextValue(dateOrText)) {
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
