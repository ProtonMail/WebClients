import { Fragment } from 'react';

import { c } from 'ttag';

import Copy from '@proton/components/components/button/Copy';
import { cleanAddressFromCommas } from '@proton/shared/lib/contacts/helpers/address';
import { getSortedProperties } from '@proton/shared/lib/contacts/properties';
import type { VCardAddress, VCardContact, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import isTruthy from '@proton/utils/isTruthy';

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
                    cleanAddressFromCommas(adr.value);

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
                        <span className="w-full flex">
                            <span className="mr-2 flex-1 text-ellipsis">
                                {lines.map((line, index) => (
                                    // No better key here and should not change in time anyway
                                    // eslint-disable-next-line react/no-array-index-key
                                    <Fragment key={index}>
                                        {line}
                                        {index !== lines.length - 1 && <br />}
                                    </Fragment>
                                ))}
                            </span>
                            <span className="shrink-0 flex py-1 contact-view-actions h-4">
                                <Copy
                                    className="ml-2 py-2 mt-0.5"
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
