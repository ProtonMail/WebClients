import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updateImageProxy } from '@proton/shared/lib/api/mailSettings';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { IMAGE_PROXY_FLAGS } from '@proton/shared/lib/mail/mailSettings';

interface Props {
    id: string;
    preventTracking: number;
    onEnable?: () => void;
}

const PreventTrackingToggle = ({ id, preventTracking, onEnable, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const api = useApi();
    const dispatch = useDispatch();
    const { state, toggle } = useToggle(hasBit(preventTracking, IMAGE_PROXY_FLAGS.PROXY));

    const handleChange = async (checked: boolean) => {
        if (!checked) {
            await api(updateImageProxy(IMAGE_PROXY_FLAGS.INCORPORATOR, 'remove'));
        }

        const { MailSettings } = await api<{ MailSettings: MailSettings }>(
            updateImageProxy(IMAGE_PROXY_FLAGS.PROXY, checked ? 'add' : 'remove')
        );
        if (checked) {
            onEnable?.();
        }
        dispatch(mailSettingsActions.updateMailSettings(MailSettings));
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
