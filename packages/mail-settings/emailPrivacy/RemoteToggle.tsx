import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
}

const RemoteToggle = ({ id, ...rest }: Props) => {
    const [mailSettings] = useMailSettings();
    const { update, isLoading } = useUpdateMailSetting();
    const state = mailSettings.HideRemoteImages === SHOW_IMAGES.SHOW;

    const handleChange = (checked: boolean) => {
        const bit = checked ? SHOW_IMAGES.SHOW : SHOW_IMAGES.HIDE;
        update('HideRemoteImages', bit);
    };

    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('HideRemoteImages')}
            {...rest}
        />
    );
};

export default RemoteToggle;
