import type { VFC } from 'react';

import { c } from 'ttag';

import { generatePassword } from '@proton/pass/password';

import { DEFAULT_RANDOM_PW_OPTIONS, getCharsGroupedByColor } from '../../../../../shared/hooks/usePasswordGenerator';
import { DropdownItem } from '../components/DropdownItem';

export const PasswordAutoSuggest: VFC<{ onSubmit: (password: string) => void }> = ({ onSubmit }) => {
    const password = generatePassword(DEFAULT_RANDOM_PW_OPTIONS);

    return (
        <DropdownItem
            onClick={() => onSubmit(password)}
            title={c('Title').t`Use secure password`}
            subTitle={<span className="text-monospace">{getCharsGroupedByColor(password)}</span>}
            icon="key"
        />
    );
};
