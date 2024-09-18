import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { updateConfirmLink } from '@proton/shared/lib/api/mailSettings';

import { useApi, useEventManager, useNotifications, useToggle } from '../../hooks';

interface Props {
    id: string;
    confirmLink: number;
}

const RequestLinkConfirmationToggle = ({ id, confirmLink }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(!!confirmLink);

    const handleChange = async (checked: boolean) => {
        await api(updateConfirmLink(+checked));
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
        />
    );
};

export default RequestLinkConfirmationToggle;
