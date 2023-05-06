import type { VFC } from 'react';

import { c } from 'ttag';

import { generatePassword, getCharsGroupedByColor } from '../../../../../shared/hooks/usePasswordGenerator';
import { DropdownItem } from '../components/DropdownItem';

export const PasswordAutoSuggest: VFC<{ onSubmit: (password: string) => void }> = ({ onSubmit }) => {
    const password = generatePassword({ useSpecialChars: true, length: 24 });

    return (
        <DropdownItem
            onClick={() => onSubmit(password)}
            title={c('Title').t`Use secure password`}
            subTitle={<span className="text-monospace">{getCharsGroupedByColor(password)}</span>}
            icon="key"
        />
    );
};
