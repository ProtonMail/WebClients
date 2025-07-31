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
    // The full text will be '<bold>Classic</bold> <Key type>'
    const classicalProtection = <strong key="CURVE25519">{c('Remark about a key type option').t`Classic`}</strong>;
    // translator: this bold text is used to make a remark about one of the encryption key options offered to the user.
    // The full text will be '<bold>Post-quantum</bold> <Key type>'
    const postQuantumProtection = <strong key="PQC">{c('Remark about a key type option').t`Post-quantum`}</strong>;

    const radios = [
        {
            label: c('Key type option').jt`${classicalProtection} (ECC Curve25519)`,
            hint: c('Key type hint').t`Faster`,
            value: CURVE25519,
        },
        {
            label: c('Key type option').jt`${postQuantumProtection} (MLDSA/MLKEM + ECC Curve25519)`,
            hint: c('Key type hint').t`Slower, but stronger long-term security`,
            value: PQC,
        },
    ];

    return (
        <div className="mt-8 mb-8">
            <div className="mb-4">
                <strong>{c('Key type selection').t`Select key type`}</strong>
            </div>
            <>
                {radios.map(({ label, value, hint }) => {
                    return (
                        <Row key={value}>
                            <Radio
                                id={`encryptionChoice${value}`}
                                data-testid={value}
                                name="encryptionType"
                                checked={value === keyGenType}
                                onChange={() => setKeyGenType(value)}
                            >
                                <span className="flex flex-column">
                                    <span>
                                        <span className="sr-only">{c('Label').t`Key strength`}</span>
                                        {label}
                                    </span>
                                    <span className="color-hint text-sm">{hint}</span>
                                </span>
                            </Radio>
                        </Row>
                    );
                })}
            </>
        </div>
    );
};

export default SelectKeyGenType;
