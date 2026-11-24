import type { ChangeEvent } from 'react';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

interface Props {
    id?: string;
    className?: string;
}

const ToggleInheritParentFolderColor = ({ id, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const { update, isLoading } = useUpdateMailSetting();

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        update('InheritParentFolderColor', +target.checked);
    };

    return (
        <Toggle
            id={id}
            checked={!!mailSettings.InheritParentFolderColor}
            className={className}
            onChange={(e) => handleChange(e)}
            loading={isLoading('InheritParentFolderColor')}
        />
    );
};

export default ToggleInheritParentFolderColor;
