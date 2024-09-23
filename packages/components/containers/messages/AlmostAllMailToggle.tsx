import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import { updateShowAlmostAllMail } from '@proton/shared/lib/api/mailSettings';

import { useApi, useEventManager, useNotifications, useToggle } from '../../hooks';

interface Props {
    id: string;
    showAlmostAllMail: number;
}

const AlmostAllMailToggle = ({ id, showAlmostAllMail }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(Boolean(showAlmostAllMail));

    const handleChange = async (checked: boolean) => {
        const bit = +checked;
        await api(updateShowAlmostAllMail(bit));
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

export default AlmostAllMailToggle;
