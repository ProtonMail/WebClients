import { useLoading } from '@proton/hooks';
import { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import type { AutoResponder } from '@proton/shared/lib/interfaces/AutoResponder';

import { Toggle } from '../../components';
import { useApi, useEventManager, useToggle } from '../../hooks';

interface Props {
    autoresponder: AutoResponder;
}

const AutoReplyToggle = ({ autoresponder, ...rest }: Props) => {
    const { state, toggle } = useToggle(!!autoresponder.IsEnabled);
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const handleToggle = async (IsEnabled: boolean) => {
        await api(updateAutoresponder({ ...autoresponder, IsEnabled }));
        await call();
        toggle();
    };

    return (
        <Toggle
            {...rest}
            loading={loading}
            checked={state}
            onChange={({ target }) => withLoading(handleToggle(!!target.checked))}
        />
    );
};

export default AutoReplyToggle;
