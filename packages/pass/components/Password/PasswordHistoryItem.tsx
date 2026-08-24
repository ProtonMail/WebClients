import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';

import { getCharsGroupedByColor } from '../../hooks/usePasswordGenerator';
import type { PasswordHistoryEntry } from '../../store/reducers';
import { epochToDateTime } from '../../utils/time/format';
import { ValueControl } from '../Form/Field/Control/ValueControl';
import { FieldsetCluster } from '../Form/Field/Layout/FieldsetCluster';
import { usePasswordHistoryActions } from './PasswordHistoryActionsContext';

export const PasswordHistoryItem: FC<PasswordHistoryEntry> = ({ value, origin, id, createTime }) => {
    const passwordHistory = usePasswordHistoryActions();

    return (
        <FieldsetCluster mode="read" as="div">
            <ValueControl
                label={origin ?? c('Placeholder').t`Unknown origin`}
                actionsContainerClassName="flex gap-2"
                clickToCopy
                hidden
                value={value}
                actions={[
                    <Button
                        key="pw-delete-button"
                        className="shrink-0"
                        icon
                        pill
                        shape="solid"
                        onClick={() => passwordHistory.remove(id)}
                    >
                        <IcCross alt={c('Action').t`Delete password`} />
                    </Button>,
                ]}
                extra={<small className="color-weak">{epochToDateTime(createTime)}</small>}
            >
                {getCharsGroupedByColor(value)}
            </ValueControl>
        </FieldsetCluster>
    );
};
