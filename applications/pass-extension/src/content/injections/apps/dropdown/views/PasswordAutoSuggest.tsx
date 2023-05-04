import type { VFC } from 'react';

import { c } from 'ttag';

import { generatePassword, getCharsGroupedByColor } from '../../../../../shared/hooks/usePasswordGenerator';
import { IFrameMessageType } from '../../../../types';
import { useIFrameContext } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';

export const PasswordAutoSuggest: VFC = () => {
    const { postMessage } = useIFrameContext();
    const password = generatePassword({ useSpecialChars: true, length: 24 });

    return (
        <DropdownItem
            onClick={() =>
                postMessage({
                    type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_PASSWORD,
                    payload: { password },
                })
            }
            title={c('Title').t`Use secure password`}
            subTitle={<span className="text-monospace">{getCharsGroupedByColor(password)}</span>}
            icon="key"
        />
    );
};
