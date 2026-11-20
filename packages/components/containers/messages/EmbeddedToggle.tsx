import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

import Toggle from '../../components/toggle/Toggle';

interface Props {
    id: string;
}

const EmbeddedToggle = ({ id }: Props) => {
    const [mailSettings] = useMailSettings();
    const { update, isLoading } = useUpdateMailSetting();
    const state = mailSettings.HideEmbeddedImages === SHOW_IMAGES.SHOW;

    const handleChange = (checked: boolean) => {
        const bit = checked ? SHOW_IMAGES.SHOW : SHOW_IMAGES.HIDE;
        update('HideEmbeddedImages', bit);
    };
    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => handleChange(target.checked)}
            loading={isLoading('HideEmbeddedImages')}
        />
    );
};

export default EmbeddedToggle;
