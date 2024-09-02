import { type FC } from 'react';

import { c } from 'ttag';

import { Toggle } from '@proton/components/components/toggle';
import { Tooltip } from '@proton/components/components/tooltip';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { isAliasDisabled } from '@proton/pass/lib/items/item.predicates';
import { aliasSyncStatusToggle } from '@proton/pass/store/actions';
import type { ItemRevision } from '@proton/pass/types';
import { not } from '@proton/pass/utils/fp/predicates';

type Props = { disabled?: boolean; revision: ItemRevision };

export const AliasSyncToggle: FC<Props> = ({ disabled, revision }) => {
    const aliasEnabled = not(isAliasDisabled)(revision);
    const { dispatch, loading } = useRequest(aliasSyncStatusToggle, {});

    return (
        <Tooltip
            openDelay={100}
            originalPlacement="bottom"
            onClick={(e) => e.stopPropagation()}
            title={
                aliasEnabled
                    ? c('Action').t`Disable this alias to stop receiving emails sent to this alias`
                    : c('Action').t`Enable this alias to receive emails sent to this alias`
            }
        >
            <div>
                {/* Adding a `div` because Tooltip doesn't seem to appear or is
                 * wrongly positioned if `<Toggle>` is the direct child element */}
                <Toggle
                    checked={aliasEnabled}
                    disabled={disabled}
                    loading={loading}
                    onChange={() =>
                        dispatch({
                            shareId: revision.shareId,
                            itemId: revision.itemId,
                            enabled: !aliasEnabled,
                        })
                    }
                />
            </div>
        </Tooltip>
    );
};
