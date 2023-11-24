import type { VFC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { ValueControl } from '@proton/pass/components/Form/Field/Control/ValueControl';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { getCharsGroupedByColor } from '@proton/pass/hooks/usePasswordGenerator';
import { passwordDelete } from '@proton/pass/store/actions/creators/password';
import type { PasswordHistoryEntry } from '@proton/pass/store/reducers';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

export const PasswordHistoryItem: VFC<PasswordHistoryEntry> = ({ value, origin, id, createTime }) => {
    const dispatch = useDispatch();

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
                        className="flex-item-noshrink"
                        icon
                        pill
                        shape="solid"
                        onClick={() => dispatch(passwordDelete({ id }))}
                    >
                        <Icon name="cross" alt={c('Action').t`Delete password`} />
                    </Button>,
                ]}
                extra={<small className="color-weak">{getFormattedDateFromTimestamp(createTime)}</small>}
            >
                {getCharsGroupedByColor(value)}
            </ValueControl>
        </FieldsetCluster>
    );
};
