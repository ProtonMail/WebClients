import React from 'react';
import { c } from 'ttag';
import { ENCRYPTION_TYPES } from '@proton/shared/lib/constants';
import { Alert, Radio, Row } from '../../../components';

const { RSA2048, RSA4096, X25519 } = ENCRYPTION_TYPES;

interface Props {
    encryptionType: string;
    setEncryptionType: React.Dispatch<React.SetStateAction<ENCRYPTION_TYPES>>;
}
const SelectEncryption = ({ encryptionType, setEncryptionType }: Props) => {
    const highSecurity = <strong key="1">{c('encryption').t`High security`}</strong>;
    const highestSecurity = <strong key="2">{c('encryption').t`Highest security`}</strong>;
    const stateOfTheArt = <strong key="3">{c('encryption').t`State of the art`}</strong>;

    const radios = [
        {
            label: c('Option').jt`${highSecurity} RSA 2048-bit (Older but faster)`,
            value: RSA2048,
        },
        {
            label: c('Option').jt`${highestSecurity} RSA 4096-bit (Secure but slow)`,
            value: RSA4096,
        },
        {
            label: c('Option').jt`${stateOfTheArt} X25519 (Modern, fastest, secure)`,
            value: X25519,
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
                            <span className="flex-item-fluid">{label}</span>
                        </Radio>
                    </Row>
                );
            })}
            {encryptionType === RSA4096 && (
                <Alert>
                    {c('Warning')
                        .t`Generating RSA 4096-bit encryption keys may crash or freeze your browser. RSA 4096-bit keys are only recommended for high performance computers - not recommended for tablet and mobile devices.`}
                </Alert>
            )}
        </>
    );
};

export default SelectEncryption;
