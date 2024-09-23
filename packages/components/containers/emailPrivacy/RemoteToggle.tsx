import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { updateHideRemoteImages } from '@proton/shared/lib/api/mailSettings';
import { SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useNotifications, useToggle } from '../../hooks';

interface Props {
    id: string;
    hideRemoteImages: number;
    onChange: (value: number) => void;
}

const RemoteToggle = ({ id, hideRemoteImages, onChange, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(hideRemoteImages === SHOW_IMAGES.SHOW);

    const handleChange = async (checked: boolean) => {
        const bit = checked ? SHOW_IMAGES.SHOW : SHOW_IMAGES.HIDE;
        await api(updateHideRemoteImages(bit));
        await call();
        toggle();
        onChange(bit);
        createNotification({ text: c('Success').t`Preference saved` });
    };
    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
            {...rest}
        />
    );
};

export default RemoteToggle;
