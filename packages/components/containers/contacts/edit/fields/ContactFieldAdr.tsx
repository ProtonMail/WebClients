import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import type { VCardAddress, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';

interface Props {
    vCardProperty: VCardProperty<VCardAddress>;
    onChange: (vCardProperty: VCardProperty) => void;
}
const ContactFieldAdr = ({ vCardProperty, onChange }: Props) => {
    const [uid] = useState(generateUID('contact-adr'));

    const handleChange =
        (part: keyof VCardAddress) =>
        ({ target }: ChangeEvent<HTMLInputElement>) => {
            onChange({ ...vCardProperty, value: { ...vCardProperty.value, [part]: target.value } });
        };

    const address = vCardProperty.value || {};

    return (
        <>
            <div className="mb-2">
                <Input
                    id={`${uid}-street`}
                    value={address.streetAddress || ''}
                    placeholder={c('Label').t`Street address`}
                    onChange={handleChange('streetAddress')}
                    data-testid="street"
                />
            </div>
            {address.extendedAddress ? (
                <div className="mb-2">
                    <Input
                        id={`${uid}-extended`}
                        value={address.extendedAddress || ''}
                        placeholder={c('Label').t`Extended address`}
                        onChange={handleChange('extendedAddress')}
                        data-testid="extended"
                    />
                </div>
            ) : null}
            <div className="mb-2 flex gap-2">
                <Input
                    id={`${uid}-postalCode`}
                    value={address.postalCode || ''}
                    placeholder={c('Label').t`Postal code`}
                    onChange={handleChange('postalCode')}
                    data-testid="postalCode"
                />
                <Input
                    id={`${uid}-locality`}
                    value={address.locality || ''}
                    placeholder={c('Label').t`City`}
                    onChange={handleChange('locality')}
                    data-testid="city"
                    className="grow-2"
                />
            </div>
            {address.postOfficeBox ? (
                <div className="mb-2">
                    <Input
                        id={`${uid}-postBox`}
                        value={address.postOfficeBox || ''}
                        placeholder={c('Label').t`Post office box`}
                        onChange={handleChange('postOfficeBox')}
                        data-testid="postBox"
                    />
                </div>
            ) : null}
            <div className="mb-2 flex gap-2">
                <Input
                    id={`${uid}-region`}
                    value={address.region || ''}
                    placeholder={c('Label').t`Region`}
                    onChange={handleChange('region')}
                    data-testid="region"
                />
                <Input
                    id={`${uid}-country`}
                    value={address.country || ''}
                    placeholder={c('Label').t`Country`}
                    onChange={handleChange('country')}
                    data-testid="country"
                />
            </div>
        </>
    );
};

export default ContactFieldAdr;
