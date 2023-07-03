import type { VFC } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import type { PasswordHistoryEntry } from '@proton/pass/store';
import { passwordDelete } from '@proton/pass/store/actions/creators/pw-history';
import { getFormattedDateFromTimestamp } from '@proton/pass/utils/time/format';

import { getCharsGroupedByColor } from '../../../shared/hooks';
import { ValueControl } from '../Field/Control/ValueControl';
import { FieldsetCluster } from '../Field/Layout/FieldsetCluster';

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
