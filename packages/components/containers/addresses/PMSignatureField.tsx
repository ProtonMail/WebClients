import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { PM_SIGNATURE } from '@proton/shared/lib/constants';
import { updatePMSignature } from '@proton/shared/lib/api/mailSettings';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { useToggle, useNotifications, useEventManager, useApiWithoutResult } from '../../hooks';
import { Toggle } from '../../components';

interface Props {
    id: string;
    mailSettings?: Partial<MailSettings>;
}

const PMSignature = ({ id, mailSettings = {} }: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updatePMSignature);
    const { state, toggle } = useToggle(!!mailSettings.PMSignature);

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(+target.checked);
        await call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <div className="flex flex-item-fluid">
            <div
                className="bordered-container flex-item-fluid pr1 pt0-5 pb0-5 mb1"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }}
            />
            <div className="ml0-5 pt0-5 on-mobile-ml0">
                <Toggle loading={loading} id={id} checked={state} onChange={handleChange} />
            </div>
        </div>
    );
};

export default PMSignature;
