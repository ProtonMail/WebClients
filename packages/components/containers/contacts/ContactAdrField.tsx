import { ContactValue } from '@proton/shared/lib/interfaces/contacts';
import { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { ADDRESS_COMPONENTS } from '@proton/shared/lib/contacts/constants';

import { InputTwo } from '../../components';
import { generateUID } from '../../helpers';

const { POST_BOX, EXTENDED, STREET, LOCALITY, REGION, POSTAL_CODE, COUNTRY } = ADDRESS_COMPONENTS;

const initialAddress = (address: ContactValue) => {
    const addressArray = Array.isArray(address) ? address : address.split(',');
    return Array.from({ length: 7 }).map((_, i) => addressArray[i] || '');
};

interface Props {
    value: ContactValue;
    onChange: (address: (string | string[])[]) => void;
}
const ContactAdrField = ({ value, onChange }: Props) => {
    const [uid] = useState(generateUID('contact-adr'));
    const [address, setAddress] = useState(initialAddress(value));

    const handleChange =
        (index: number) =>
        ({ target }: ChangeEvent<HTMLInputElement>) => {
            const newValue = target.value.includes(',') ? target.value.split(',') : target.value;
            const newAddress = [...address];
            newAddress[index] = newValue;
            setAddress(newAddress);
            onChange(newAddress);
        };

    return (
        <>
            <div className="mb1">
                <InputTwo
                    id={`${uid}-street`}
                    value={address[STREET]}
                    placeholder={c('Label').t`Street address`}
                    onChange={handleChange(STREET)}
                    data-testid="street"
                />
            </div>
            {address[EXTENDED] ? (
                <div className="mb1">
                    <InputTwo
                        id={`${uid}-extended`}
                        value={address[EXTENDED]}
                        placeholder={c('Label').t`Extended address`}
                        onChange={handleChange(EXTENDED)}
                        data-testid="extended"
                    />
                </div>
            ) : null}
            <div className="mb1">
                <InputTwo
                    id={`${uid}-postalCode`}
                    value={address[POSTAL_CODE]}
                    placeholder={c('Label').t`Postal code`}
                    onChange={handleChange(POSTAL_CODE)}
                    data-testid="postalCode"
                />
            </div>
            <div className="mb1">
                <InputTwo
                    id={`${uid}-locality`}
                    value={address[LOCALITY]}
                    placeholder={c('Label').t`City`}
                    onChange={handleChange(LOCALITY)}
                    data-testid="city"
                />
            </div>
            {address[POST_BOX] ? (
                <div className="mb1">
                    <InputTwo
                        id={`${uid}-postBox`}
                        value={address[POST_BOX]}
                        placeholder={c('Label').t`Post office box`}
                        onChange={handleChange(POST_BOX)}
                        data-testid="postBox"
                    />
                </div>
            ) : null}
            <div className="mb1">
                <label className="text-sm color-weak" htmlFor={`${uid}-region`} />
                <InputTwo
                    id={`${uid}-region`}
                    value={address[REGION]}
                    placeholder={c('Label').t`Region`}
                    onChange={handleChange(REGION)}
                    data-testid="region"
                />
            </div>
            <div>
                <InputTwo
                    id={`${uid}-country`}
                    value={address[COUNTRY]}
                    placeholder={c('Label').t`Country`}
                    onChange={handleChange(COUNTRY)}
                    data-testid="country"
                />
            </div>
        </>
    );
};

export default ContactAdrField;
