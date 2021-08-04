import { useState } from 'react';
import * as React from 'react';

import { updateAutoresponder } from '@proton/shared/lib/api/mailSettings';
import { AutoResponder } from '@proton/shared/lib/interfaces/AutoResponder';

import { useToggle, useEventManager, useApiWithoutResult } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    autoresponder: AutoResponder;
}

const AutoReplyToggle = ({ autoresponder, ...rest }: Props) => {
    const { state, toggle } = useToggle(!!autoresponder.IsEnabled);
    const { call } = useEventManager();
    const { request } = useApiWithoutResult(updateAutoresponder);
    const [loading, setLoading] = useState(false);

    const handleToggle = async ({ target }: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setLoading(true);
            await request({ ...autoresponder, IsEnabled: target.checked });
            await call();
            setLoading(false);
            toggle();
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    return <Toggle {...rest} loading={loading} checked={state} onChange={handleToggle} />;
};

export default AutoReplyToggle;
