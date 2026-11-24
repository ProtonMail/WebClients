import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import Select from '@proton/components/components/select/Select';
import { MIME_TYPES } from '@proton/shared/lib/constants';

const { DEFAULT, PLAINTEXT } = MIME_TYPES;

interface Props {
    id: string;
    draftType: MIME_TYPES;
    onChange: (draftType: MIME_TYPES) => void;
    loading: boolean;
}

const DraftTypeSelect = ({ id, draftType, onChange, loading, ...rest }: Props) => {
    const options = [
        { text: c('Option').t`Normal`, value: DEFAULT },
        { text: c('Option').t`Plain text`, value: PLAINTEXT },
    ];

    const handleChange = ({ target }: ChangeEvent<HTMLSelectElement>) => onChange(target.value as MIME_TYPES);

    return <Select id={id} value={draftType} options={options} disabled={loading} onChange={handleChange} {...rest} />;
};

export default DraftTypeSelect;
