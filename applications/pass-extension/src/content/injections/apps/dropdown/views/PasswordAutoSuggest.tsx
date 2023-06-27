import type { VFC } from 'react';

import { c } from 'ttag';

import { generatePassword } from '@proton/pass/password';

import { DEFAULT_RANDOM_PW_OPTIONS, getCharsGroupedByColor } from '../../../../../shared/hooks/usePasswordGenerator';
import type { IFrameMessage } from '../../../../types';
import { IFrameMessageType } from '../../../../types';
import { DropdownItem } from '../components/DropdownItem';

export const PasswordAutoSuggest: VFC<{ onMessage?: (message: IFrameMessage) => void }> = ({ onMessage }) => {
    const password = generatePassword(DEFAULT_RANDOM_PW_OPTIONS);

    return (
        <DropdownItem
            icon="key"
            className="ui-password"
            title={c('Title').t`Use secure password`}
            subTitle={<span className="text-monospace">{getCharsGroupedByColor(password)}</span>}
            onClick={() =>
                onMessage?.({
                    type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_PASSWORD,
                    payload: { password },
                })
            }
        />
    );
};
