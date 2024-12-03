import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { KEYGEN_TYPES } from '@proton/shared/lib/constants';

import Row from '../../../components/container/Row';
import Radio from '../../../components/input/Radio';

const { PQC, CURVE25519 } = KEYGEN_TYPES;

interface Props {
    keyGenType: string;
    setKeyGenType: Dispatch<SetStateAction<KEYGEN_TYPES>>;
}
const SelectKeyGenType = ({ keyGenType, setKeyGenType }: Props) => {
    // translator: this bold text is used to make a remark about one of the encryption key options offered to the user.
    // The full text will be '<bold>Classical protection</bold> <Key type>'
    const classicalProtection = <strong key="CURVE25519">{c('Remark about a key type option').t`Classical`}</strong>;
    // translator: this bold text is used to make a remark about one of the encryption key options offered to the user.
    // The full text will be '<bold>Post-Quantum protection</bold> <Key type>'
    const postQuantumProtection = <strong key="PQC">{c('Remark about a key type option').t`Post-Quantum`}</strong>;

    const radios = [
        {
            label: c('Key type option').jt`${classicalProtection} ECC Curve25519 (Fastest)`,
            value: CURVE25519,
        },
        {
            label: c('Key type option')
                .jt`${postQuantumProtection} Hybrid MLDSA/MLKEM + ECC Curve25519 (Slower, but stronger long-term security)`,
            value: PQC,
        },
    ];

    return (
        <>
            {radios.map(({ label, value }) => {
                return (
                    <Row key={value}>
                        <Radio
                            id={`encryptionChoice${value}`}
                            data-testid={value}
                            name="encryptionType"
                            checked={value === keyGenType}
                            onChange={() => setKeyGenType(value)}
                        >
                            <span className="flex-1">
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

export default SelectKeyGenType;
