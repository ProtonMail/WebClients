import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    id?: string;
    className?: string;
}

export const UnreadFaviconCounterToggle = ({ id, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const { update, isLoading } = useUpdateMailSetting();
    const state = !!mailSettings.UnreadFavicon;

    const handleChange = (checked: boolean) => {
        update('UnreadFavicon', +checked);
    };

    return (
        <Toggle
            id={id}
            className={className}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('UnreadFavicon')}
        />
    );
};
