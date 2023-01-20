import { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { ENCRYPTION_TYPES } from '@proton/shared/lib/constants';

import { Radio, Row } from '../../../components';

const { RSA4096, CURVE25519 } = ENCRYPTION_TYPES;

interface Props {
    encryptionType: string;
    setEncryptionType: Dispatch<SetStateAction<ENCRYPTION_TYPES>>;
}
const SelectEncryption = ({ encryptionType, setEncryptionType }: Props) => {
    // translator: this bold text is used to make a remark about one of the encryption key options offered to the user.
    // The full text will be '<bold>State of the art</bold> <Key type>'
    const stateOfTheArt = <strong key="CURVE25519">{c('Remark about a key type option').t`State of the art`}</strong>;
    // translator: this bold text is used to make a remark about one of the encryption key options offered to the user.
    // The full text will be '<bold>Compatibility</bold> <Key type>'
    const compatibility = <strong key="RSA4096">{c('Remark about a key type option').t`Compatibility`}</strong>;

    const radios = [
        {
            label: c('Key type option').jt`${stateOfTheArt} ECC Curve25519 (Fastest, most modern)`,
            value: CURVE25519,
        },
        {
            label: c('Key type option')
                .jt`${compatibility} RSA 4096-bit (Slower, but increased compatibility with legacy software)`,
            value: RSA4096,
        },
    ];

    return (
        <>
            {radios.map(({ label, value }, i) => {
                const id = i.toString();
                return (
                    <Row key={i}>
                        <Radio
                            id={`encryptionChoice${id}`}
                            name="encryptionType"
                            checked={value === encryptionType}
                            onChange={() => setEncryptionType(value)}
                        >
                            <span className="flex-item-fluid">
                                <span className="sr-only">{c('Label').t`Key strength`}</span>
                                {label}
                            </span>
                        </Radio>
                    </Row>
                );
            })}
        </>
    );
};

export default SelectEncryption;
