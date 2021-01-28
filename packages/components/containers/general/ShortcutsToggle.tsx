import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { updateShortcuts } from 'proton-shared/lib/api/mailSettings';
import { useToggle, useEventManager, useApiWithoutResult, useNotifications } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    id: string;
    shortcuts: number;
    className?: string;
    onChange: (value: number) => void;
}

const ShortcutsToggle = ({ id, shortcuts, onChange, className }: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updateShortcuts);
    const { state, toggle } = useToggle(!!shortcuts);
    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(+target.checked);
        call();
        toggle();
        onChange(+target.checked);
        createNotification({ text: c('Success').t`Keyboard shortcuts preferences updated` });
    };
    return <Toggle id={id} className={className} checked={state} onChange={handleChange} loading={loading} />;
};

export default ShortcutsToggle;
