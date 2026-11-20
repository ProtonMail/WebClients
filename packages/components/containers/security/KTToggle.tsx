import type { ChangeEvent } from 'react';

import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    id?: string;
}

const KTToggle = ({ id }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const [mailSettings] = useMailSettings();

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        update('KT', +target.checked);
    };

    return <Toggle id={id} loading={isLoading('KT')} checked={!!mailSettings.KT} onChange={(e) => handleChange(e)} />;
};

export default KTToggle;
