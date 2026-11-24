import Toggle from '@proton/components/components/toggle/Toggle';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

interface Props {
    id?: string;
    className?: string;
}

const SenderImagesToggle = ({ id, className }: Props) => {
    const [mailSettings] = useMailSettings();
    const state = !mailSettings.HideSenderImages;
    const { update, isLoading } = useUpdateMailSetting();

    const handleChange = (checked: boolean) => {
        update('HideSenderImages', +!checked);
    };

    return (
        <Toggle
            id={id}
            className={className}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('HideSenderImages')}
        />
    );
};

export default SenderImagesToggle;
