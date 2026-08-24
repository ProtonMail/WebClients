import type { FC } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Toggle from '@proton/components/components/toggle/Toggle';

import { useRequest } from '../../../hooks/useRequest';
import { isDisabledAlias } from '../../../lib/items/item.predicates';
import { aliasSyncStatusToggle } from '../../../store/actions';
import type { ItemRevision } from '../../../types';
import { not } from '../../../utils/fp/predicates';

type Props = { disabled?: boolean; revision: ItemRevision };

export const AliasStatusToggle: FC<Props> = ({ disabled, revision }) => {
    const aliasEnabled = not(isDisabledAlias)(revision);
    const { dispatch, loading } = useRequest(aliasSyncStatusToggle, { initial: revision });

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
