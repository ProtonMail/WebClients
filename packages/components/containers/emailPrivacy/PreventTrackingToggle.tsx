import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { updateImageProxy } from '@proton/shared/lib/api/mailSettings';
import { useApi, useEventManager, useLoading, useNotifications, useToggle } from '../../hooks';
import { Toggle } from '../../components/toggle';

interface Props {
    id: string;
    preventTracking: number;
}

const PreventTrackingToggle = ({ id, preventTracking, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(hasBit(preventTracking, IMAGE_PROXY_FLAGS.PROXY));

    const handleChange = async (checked: boolean) => {
        if (!checked) {
            await api(updateImageProxy(IMAGE_PROXY_FLAGS.INCORPORATOR, 'remove'));
        }

        await api(updateImageProxy(IMAGE_PROXY_FLAGS.PROXY, checked ? 'add' : 'remove'));
        await call();
        toggle();

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

export default PreventTrackingToggle;
