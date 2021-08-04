import * as React from 'react';
import { c } from 'ttag';

import { updateLabel } from '@proton/shared/lib/api/labels';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { Tooltip, Toggle } from '../../components';
import { useApi, useLoading, useEventManager, useNotifications } from '../../hooks';

interface Props {
    label: Folder;
}

const ToggleNotify = ({ label }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const handleChange = async ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = {
            ...label,
            Notify: +target.checked,
        };
        await api(updateLabel(label.ID, newLabel));
        await call();
        createNotification({
            text: c('label/folder notification').t`${label.Name} updated`,
        });
    };
    return (
        <Tooltip title={c('Tooltip').t`Enable/disable desktop and mobile notifications`}>
            <span>
                <Toggle
                    id={`item-${label.ID}`}
                    checked={label.Notify === 1}
                    onChange={(e) => withLoading(handleChange(e))}
                    loading={loading}
                />
            </span>
        </Tooltip>
    );
};

export default ToggleNotify;
