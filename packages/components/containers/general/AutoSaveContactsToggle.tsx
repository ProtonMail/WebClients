import type { ChangeEvent } from 'react';

import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    autoSaveContacts: boolean;
    id?: string;
    className?: string;
}

const AutoSaveContactsToggle = ({ autoSaveContacts, id, className }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        update('AutoSaveContacts', +event.target.checked);
    };

    return (
        <Toggle
            id={id}
            className={className}
            loading={isLoading('AutoSaveContacts')}
            checked={autoSaveContacts}
            onChange={(event) => handleChange(event)}
        />
    );
};

export default AutoSaveContactsToggle;
