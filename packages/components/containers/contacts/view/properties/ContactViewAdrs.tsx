import { Fragment } from 'react';

import { c } from 'ttag';

import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import { VCardAddress, VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import isTruthy from '@proton/utils/isTruthy';

import { Copy } from '../../../../components';
import { useNotifications } from '../../../../hooks';
import { ContactViewProperties } from './ContactViewProperties';
import ContactViewProperty from './ContactViewProperty';

interface Props {
    vCardContact: VCardContact;
    isSignatureVerified?: boolean;
}

const ContactViewAdrs = ({ vCardContact, isSignatureVerified = false }: Props) => {
    const { createNotification } = useNotifications();

    const adrs: VCardProperty<VCardAddress>[] = getSortedProperties(vCardContact, 'adr');

    if (adrs.length === 0) {
        return null;
    }

    return (
        <ContactViewProperties>
            {adrs.map((adr, i) => {
                const { streetAddress, extendedAddress, postalCode, postOfficeBox, locality, region, country } =
                    adr.value;

                const lines = [
                    streetAddress,
                    extendedAddress,
                    [postalCode, locality].filter(isTruthy).join(', '),
                    postOfficeBox,
                    [region, country].filter(isTruthy).join(', '),
                ].filter(isTruthy);

                return (
                    <ContactViewProperty
                        // I have nothing better for the key there
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        field="adr"
                        type={adr.params?.type}
                        isSignatureVerified={isSignatureVerified}
                    >
                        <span className="w100 flex">
                            <span className="mr0-5 flex-item-fluid text-ellipsis">
                                {lines.map((line, index) => (
                                    // No better key here and should not change in time anyway
                                    // eslint-disable-next-line react/no-array-index-key
                                    <Fragment key={index}>
                                        {line}
                                        {index !== lines.length - 1 && <br />}
                                    </Fragment>
                                ))}
                            </span>
                            <span className="flex-item-noshrink flex py0-25 pr0-25 contact-view-actions">
                                <Copy
                                    className="ml0-5 pt0-5 pb0-5 mt0-1"
                                    value={lines.join(', ')}
                                    onCopy={() => {
                                        createNotification({ text: c('Success').t`Address copied to clipboard` });
                                    }}
                                />
                            </span>
                        </span>
                    </ContactViewProperty>
                );
            })}
        </ContactViewProperties>
    );
};

export default ContactViewAdrs;
