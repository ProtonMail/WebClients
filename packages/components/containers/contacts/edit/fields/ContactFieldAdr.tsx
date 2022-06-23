import { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { VCardAddress, VCardProperty } from '@proton/shared/lib/interfaces/contacts/VCard';
import { InputTwo } from '../../../../components';
import { generateUID } from '../../../../helpers';

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
            <div className="mb1">
                <InputTwo
                    id={`${uid}-street`}
                    value={address.streetAddress || ''}
                    placeholder={c('Label').t`Street address`}
                    onChange={handleChange('streetAddress')}
                    data-testid="street"
                />
            </div>
            {address.extendedAddress ? (
                <div className="mb1">
                    <InputTwo
                        id={`${uid}-extended`}
                        value={address.extendedAddress || ''}
                        placeholder={c('Label').t`Extended address`}
                        onChange={handleChange('extendedAddress')}
                        data-testid="extended"
                    />
                </div>
            ) : null}
            <div className="mb1">
                <InputTwo
                    id={`${uid}-postalCode`}
                    value={address.postalCode || ''}
                    placeholder={c('Label').t`Postal code`}
                    onChange={handleChange('postalCode')}
                    data-testid="postalCode"
                />
            </div>
            <div className="mb1">
                <InputTwo
                    id={`${uid}-locality`}
                    value={address.locality || ''}
                    placeholder={c('Label').t`City`}
                    onChange={handleChange('locality')}
                    data-testid="city"
                />
            </div>
            {address.postOfficeBox ? (
                <div className="mb1">
                    <InputTwo
                        id={`${uid}-postBox`}
                        value={address.postOfficeBox || ''}
                        placeholder={c('Label').t`Post office box`}
                        onChange={handleChange('postOfficeBox')}
                        data-testid="postBox"
                    />
                </div>
            ) : null}
            <div className="mb1">
                <label className="text-sm color-weak" htmlFor={`${uid}-region`} />
                <InputTwo
                    id={`${uid}-region`}
                    value={address.region || ''}
                    placeholder={c('Label').t`Region`}
                    onChange={handleChange('region')}
                    data-testid="region"
                />
            </div>
            <div>
                <InputTwo
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
