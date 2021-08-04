import { useState } from 'react';
import { c } from 'ttag';
import { addIncomingDefault, updateIncomingDefault } from '@proton/shared/lib/api/incomingDefaults';
import { noop } from '@proton/shared/lib/helpers/function';
import { IncomingDefault } from '@proton/shared/lib/interfaces/IncomingDefault';
import { BLACKLIST_LOCATION, WHITELIST_LOCATION } from '@proton/shared/lib/constants';

import { FormModal, Radio, Row, Label, Field } from '../../components';
import { useNotifications, useApi, useLoading } from '../../hooks';

import AddEmailToList from './spamlist/AddEmailToList';
import AddDomainToList from './spamlist/AddDomainToList';

import { WHITE_OR_BLACK_LOCATION } from './interfaces';
import { DOMAIN_MODE, EMAIL_MODE } from './constants';

interface Props {
    type: WHITE_OR_BLACK_LOCATION;
    incomingDefault?: IncomingDefault;
    onClose?: () => void;
    onAdd: (incomingDefault: IncomingDefault) => void;
}

function AddEmailToListModal({ type, incomingDefault, onAdd = noop, onClose = noop, ...rest }: Props) {
    const I18N = {
        ADD: {
            [BLACKLIST_LOCATION]: c('Title').t`Add to Block List`,
            [WHITELIST_LOCATION]: c('Title').t`Add to Allow List`,
        },
        EDIT: {
            [BLACKLIST_LOCATION]: c('Title').t`Edit Block List`,
            [WHITELIST_LOCATION]: c('Title').t`Edit Allow List`,
        },
    };

    const { ID, Domain, Email } = incomingDefault || {};
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const [mode, setMode] = useState(Domain ? DOMAIN_MODE : EMAIL_MODE);
    const [email, setEmail] = useState(Email || '');
    const [domain, setDomain] = useState(Domain || '');

    const handleSubmit = async () => {
        const parameters = {
            Location: type,
            ...(mode === EMAIL_MODE ? { Email: email } : { Domain: domain }),
        };
        const { IncomingDefault: data } = ID
            ? await api(updateIncomingDefault(ID, parameters))
            : await api(addIncomingDefault(parameters));
        const domainTxt = ID ? c('Spam notification').t`${domain} updated` : c('Spam notification').t`${domain} added`;
        const emailTxt = ID ? c('Spam notification').t`${email} updated` : c('Spam notification').t`${email} added`;
        createNotification({
            text: mode === EMAIL_MODE ? emailTxt : domainTxt,
        });
        onAdd(data);
        onClose();
    };

    return (
        <FormModal
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
            title={ID ? I18N.EDIT[type] : I18N.ADD[type]}
            submit={c('Action').t`Save`}
            onClose={onClose}
            {...rest}
        >
            <Row>
                <Label>{c('Label').t`Want to add`}</Label>
                <Field>
                    <Radio
                        id="email-mode"
                        checked={mode === EMAIL_MODE}
                        onChange={() => setMode(EMAIL_MODE)}
                        className="mr1"
                        name="filterMode"
                    >
                        {c('Label').t`Email`}
                    </Radio>
                    <Radio
                        id="domain-mode"
                        checked={mode === DOMAIN_MODE}
                        onChange={() => setMode(DOMAIN_MODE)}
                        name="filterMode"
                    >
                        {c('Label').t`Domain`}
                    </Radio>
                </Field>
            </Row>
            {mode === EMAIL_MODE ? <AddEmailToList email={email} onChange={setEmail} /> : null}
            {mode === DOMAIN_MODE ? <AddDomainToList domain={domain} onChange={setDomain} /> : null}
        </FormModal>
    );
}

export default AddEmailToListModal;
