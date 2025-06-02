import type { ChangeEvent } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { updateLabel } from '@proton/shared/lib/api/labels';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

interface Props {
    label: Folder;
}

const ToggleNotify = ({ label }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const labelName = label.Name;

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        const newLabel = {
            ...label,
            Notify: +target.checked,
        };
        await api(updateLabel(label.ID, newLabel));
        await call();
        createNotification({
            text: c('label/folder notification').t`${labelName} updated`,
        });
    };

    return (
        <Tooltip title={c('Tooltip').t`Enable/disable desktop and mobile notifications for “${labelName}”`}>
            <span className="inline-flex">
                <label htmlFor={`item-${label.ID}`} className="sr-only">{c('Tooltip')
                    .t`Enable/disable desktop and mobile notifications for “${labelName}”`}</label>
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
