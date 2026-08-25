import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateShowAlmostAllMail } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import Toggle from '../../components/toggle/Toggle';
import useApi from '../../hooks/useApi';
import useToggle from '../../hooks/useToggle';

interface Props {
    id: string;
    showAlmostAllMail: number;
}

const AlmostAllMailToggle = ({ id, showAlmostAllMail }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const dispatch = useDispatch();
    const { state, toggle } = useToggle(Boolean(showAlmostAllMail));

    const handleChange = async (checked: boolean) => {
        const bit = +checked;
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateShowAlmostAllMail(bit));
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
        />
    );
};

export default AlmostAllMailToggle;
