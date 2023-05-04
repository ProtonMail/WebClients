import type { VFC } from 'react';

import { c } from 'ttag';

import type { AliasState } from '@proton/pass/store';

import { AliasPreview } from '../../../../../shared/components/alias/Alias.preview';
import { IFrameMessageType } from '../../../../types';
import { useIFrameContext } from '../../context/IFrameContextProvider';
import { DropdownItem } from '../components/DropdownItem';

export const AliasAutoSuggest: VFC<{ options: AliasState['aliasOptions']; prefix: string }> = ({ options, prefix }) => {
    const { postMessage } = useIFrameContext();
    const defaultSuffix = options?.suffixes?.[0];
    const validAlias = options !== null && defaultSuffix !== undefined;

    return (
        <DropdownItem
            disabled={options === null || defaultSuffix === undefined}
            onClick={() =>
                validAlias &&
                postMessage({
                    type: IFrameMessageType.DROPDOWN_AUTOSUGGEST_ALIAS,
                    payload: {
                        alias: {
                            mailboxes: [options.mailboxes?.[0]],
                            prefix,
                            signedSuffix: defaultSuffix.signedSuffix,
                            aliasEmail: `${prefix}${defaultSuffix.suffix}`,
                        },
                    },
                })
            }
            title={c('Title').t`Create email alias`}
            subTitle={
                defaultSuffix ? (
                    <AliasPreview prefix={prefix} suffix={defaultSuffix.suffix} standalone />
                ) : (
                    <span className="color-danger">{c('Warning').t`Cannot create alias`}</span>
                )
            }
            icon="alias"
        />
    );
};
