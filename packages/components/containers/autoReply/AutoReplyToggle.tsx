import { ChangeEvent, useState } from 'react';

import { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import { AutoResponder } from '@proton/shared/lib/interfaces/AutoResponder';

import { Toggle } from '../../components';
import { useApiWithoutResult, useEventManager, useToggle } from '../../hooks';

interface Props {
    autoresponder: AutoResponder;
}

const AutoReplyToggle = ({ autoresponder, ...rest }: Props) => {
    const { state, toggle } = useToggle(!!autoresponder.IsEnabled);
    const { call } = useEventManager();
    const { request } = useApiWithoutResult(updateAutoresponder);
    const [loading, setLoading] = useState(false);

    const handleToggle = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        try {
            setLoading(true);
            await request({ ...autoresponder, IsEnabled: target.checked });
            await call();
            setLoading(false);
            toggle();
        } catch (error: any) {
            setLoading(false);
            throw error;
        }
    };

    return <Toggle {...rest} loading={loading} checked={state} onChange={handleToggle} />;
};

export default AutoReplyToggle;
