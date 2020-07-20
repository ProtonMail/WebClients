import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FormModal, Radio, Href, useApi, useLoading, useNotifications, useEventManager } from 'react-components';
import { DKIM_RSA_1024, DKIM_RSA_2048 } from 'proton-shared/lib/constants';
import { generateKey } from 'proton-shared/lib/api/domains';
import { c } from 'ttag';

const GenerateKeyModal = ({ domain, ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [algorithm, setAlgorithm] = useState(DKIM_RSA_2048);
    const [loading, withLoading] = useLoading();

    const generate = async () => {
        await api(generateKey(domain.ID, algorithm));
        await call();
        createNotification({ text: c('Success').t`Key successfully generated` });
        rest.onClose();
    };

    return (
        <FormModal
            loading={loading}
            onSubmit={() => withLoading(generate())}
            title={c('Title').t`Generate key`}
            submit={c('Action').t`Generate`}
            {...rest}
        >
            <p className="mb1">{c('Info').t`Please select the type of key you want to generate:`}</p>
            <Radio
                className="ml1 flex flex-nowrap mb1 pm-radio--onTop"
                checked={algorithm === DKIM_RSA_2048}
                onChange={() => setAlgorithm(DKIM_RSA_2048)}
                disabled={loading}
            >
                <div className="ml1 flex flex-column">
                    <strong>{c('Label').t`2048 RSA key`}</strong>
                    <p className="mt0 mb0">{c('Info')
                        .t`We recommend using this key. It is longer and therefore more secure.`}</p>
                </div>
            </Radio>
            <Radio
                className="ml1 flex flex-nowrap pm-radio--onTop"
                checked={algorithm === DKIM_RSA_1024}
                onChange={() => setAlgorithm(DKIM_RSA_1024)}
                disabled={loading}
            >
                <div className="ml1 flex flex-column">
                    <strong>{c('Label').t`1024 RSA key`}</strong>
                    <p className="mt0 mb0">
                        <span className="mr0-5">{c('Info')
                            .t`You should use this key if your registrar does not support long TXT records and you’re unable to use 2048.`}</span>
                        <Href url="https://protonmail.com/support/knowledge-base/anti-spoofing/">{c('Link')
                            .t`Learn more`}</Href>
                    </p>
                </div>
            </Radio>
        </FormModal>
    );
};

GenerateKeyModal.propTypes = {
    domain: PropTypes.object.isRequired,
};

export default GenerateKeyModal;
