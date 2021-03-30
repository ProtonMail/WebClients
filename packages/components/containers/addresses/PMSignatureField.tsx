import React, { ChangeEvent } from 'react';
import { c } from 'ttag';
import { PM_SIGNATURE } from 'proton-shared/lib/constants';
import { updatePMSignature } from 'proton-shared/lib/api/mailSettings';
import { MailSettings } from 'proton-shared/lib/interfaces';

import { useToggle, useNotifications, useEventManager, useApiWithoutResult } from '../../hooks';
import { Toggle, Field } from '../../components';

interface Props {
    id: string;
    mailSettings?: Partial<MailSettings>;
}

const PMSignatureField = ({ id, mailSettings = {} }: Props) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(updatePMSignature);
    const { state, toggle } = useToggle(!!mailSettings.PMSignature);
    const isMandatory = mailSettings.PMSignature === 2;

    const handleChange = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await request(+target.checked);
        call();
        toggle();
        createNotification({ text: c('Success').t`Preference saved` });
    };

    return (
        <>
            <Field>
                <div className="bordered pl1 pr1 pt0-5 pb0-5 mb1" dangerouslySetInnerHTML={{ __html: PM_SIGNATURE }} />
            </Field>
            {isMandatory ? null : (
                <div className="ml1 pt0-5 on-mobile-ml0">
                    <Toggle loading={loading} id={id} checked={state} onChange={handleChange} />
                </div>
            )}
        </>
    );
};

export default PMSignatureField;
