import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import { useLoading } from '@proton/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updateConfirmLink } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    id: string;
    confirmLink: number;
}

const RequestLinkConfirmationToggle = ({ id, confirmLink }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const dispatch = useDispatch();
    const { state, toggle } = useToggle(!!confirmLink);

    const handleChange = async (checked: boolean) => {
        const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateConfirmLink(+checked));
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

export default RequestLinkConfirmationToggle;
