import type { ChangeEvent } from 'react';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

interface Props {
    id?: string;
}

const PromptPinToggle = ({ id }: Props) => {
    const { update, isLoading } = useUpdateMailSetting();
    const [mailSettings] = useMailSettings();

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        update('PromptPin', +target.checked);
    };

    return (
        <Toggle
            id={id}
            loading={isLoading('PromptPin')}
            checked={!!mailSettings.PromptPin}
            onChange={(e) => handleChange(e)}
        />
    );
};

export default PromptPinToggle;
