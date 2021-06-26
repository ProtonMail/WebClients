import React from 'react';

import { PACKAGE_TYPE } from 'proton-shared/lib/constants';

import { Select } from '../../components';

interface Props {
    pgpScheme: number;
    id: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    disabled: boolean;
}

const PGPSchemeSelect = ({ id, pgpScheme, onChange, disabled, ...rest }: Props) => {
    const options = [
        { value: PACKAGE_TYPE.SEND_PGP_MIME, text: 'PGP/MIME' },
        { value: PACKAGE_TYPE.SEND_PGP_INLINE, text: 'Inline PGP' },
    ];
    return <Select id={id} value={pgpScheme} options={options} disabled={disabled} onChange={onChange} {...rest} />;
};

export default PGPSchemeSelect;
