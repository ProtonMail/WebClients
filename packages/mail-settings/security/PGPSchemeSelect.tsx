import type { ChangeEvent } from 'react';

import Select from '@proton/components/components/select/Select';
import { PACKAGE_TYPE } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    pgpScheme: number;
    id: string;
    onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    disabled: boolean;
}

export const PGPSchemeSelect = ({ id, pgpScheme, onChange, disabled, ...rest }: Props) => {
    const options = [
        { value: PACKAGE_TYPE.SEND_PGP_MIME, text: 'PGP/MIME' },
        { value: PACKAGE_TYPE.SEND_PGP_INLINE, text: 'PGP/Inline' },
    ];
    return <Select id={id} value={pgpScheme} options={options} disabled={disabled} onChange={onChange} {...rest} />;
};
