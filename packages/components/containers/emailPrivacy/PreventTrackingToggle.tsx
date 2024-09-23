import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { updateImageProxy } from '@proton/shared/lib/api/mailSettings';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager, useNotifications, useToggle } from '../../hooks';

interface Props {
    id: string;
    preventTracking: number;
    onEnable?: () => void;
}

const PreventTrackingToggle = ({ id, preventTracking, onEnable, ...rest }: Props) => {
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
        if (checked) {
            onEnable?.();
        }
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
