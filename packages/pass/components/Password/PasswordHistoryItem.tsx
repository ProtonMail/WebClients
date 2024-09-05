import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import type { PasswordHistoryEntry } from '@proton/pass/store/reducers';
import { epochToDateTime } from '@proton/pass/utils/time/format';

import { usePasswordContext } from './PasswordContext';

export const PasswordHistoryItem: FC<PasswordHistoryEntry> = ({ value, origin, id, createTime }) => {
    const passwordContext = usePasswordContext();

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
                        onClick={() => passwordContext.history.remove(id)}
                    >
                        <Icon name="cross" alt={c('Action').t`Delete password`} />
                    </Button>,
                ]}
                extra={<small className="color-weak">{epochToDateTime(createTime)}</small>}
            >
                {getCharsGroupedByColor(value)}
            </ValueControl>
        </FieldsetCluster>
    );
};
