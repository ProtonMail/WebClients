import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import { ADDRESS_COMPONENTS } from '@proton/shared/lib/contacts/constants';
import { classnames, generateUID } from '../../helpers';
import Input from '../input/Input';

const { POST_BOX, EXTENDED, STREET, LOCALITY, REGION, POSTAL_CODE, COUNTRY } = ADDRESS_COMPONENTS;

interface Props {
    value: string | string[];
    onChange: (address: string[]) => void;
}

const initialAddress = (address: string | string[]) => {
    const addressArray = Array.isArray(address) ? address : address.split(',');
    return Array.from({ length: 7 }).map((_, i) => addressArray[i] || '');
};

const ContactAdrField = ({ value, onChange }: Props) => {
    const [uid] = useState(generateUID('contact-adr'));
    const [address, setAddress] = useState(initialAddress(value));

    const handleChange =
        (index: number) =>
        ({ target }: ChangeEvent<HTMLInputElement>) => {
            const newAddress = [...address];
            newAddress[index] = target.value;
            setAddress(newAddress);
            onChange(newAddress);
        };

    return (
        <>
            <div className="mb1">
                <Input
                    id={`${uid}-street`}
                    value={address[STREET]}
                    placeholder={c('Label').t`Street address`}
                    onChange={handleChange(STREET)}
                    autoFocus
                />
            </div>
            <div className="mb1">
                <Input
                    id={`${uid}-locality`}
                    value={address[LOCALITY]}
                    placeholder={c('Label').t`City`}
                    onChange={handleChange(LOCALITY)}
                />
            </div>
            <div className="mb1">
                <label className="text-sm color-weak" htmlFor={`${uid}-region`} />
                <Input
                    id={`${uid}-region`}
                    value={address[REGION]}
                    placeholder={c('Label').t`Region`}
                    onChange={handleChange(REGION)}
                />
            </div>
            <div className="mb1">
                <Input
                    id={`${uid}-postalCode`}
                    value={address[POSTAL_CODE]}
                    placeholder={c('Label').t`Postal code`}
                    onChange={handleChange(POSTAL_CODE)}
                />
            </div>
            <div className={classnames([(address[POST_BOX] || address[EXTENDED]) && 'mb1'])}>
                <Input
                    id={`${uid}-country`}
                    value={address[COUNTRY]}
                    placeholder={c('Label').t`Country`}
                    onChange={handleChange(COUNTRY)}
                />
            </div>
            {address[POST_BOX] ? (
                <div className={classnames([address[EXTENDED] && 'mb1'])}>
                    <Input
                        id={`${uid}-postBox`}
                        value={address[POST_BOX]}
                        placeholder={c('Label').t`Post office box`}
                        onChange={handleChange(POST_BOX)}
                    />
                </div>
            ) : null}
            {address[EXTENDED] ? (
                <div>
                    <Input
                        id={`${uid}-extended`}
                        value={address[EXTENDED]}
                        placeholder={c('Label').t`Extended address`}
                        onChange={handleChange(EXTENDED)}
                    />
                </div>
            ) : null}
        </>
    );
};

export default ContactAdrField;
