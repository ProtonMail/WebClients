import { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Alert, Row, Label, Input, Field } from '../../components';

const DomainSection = ({ domain, onChange }) => {
    const [domainName, updateDomainName] = useState(domain.DomainName || '');

    const handleChange = ({ target }) => {
        const name = target.value;

        onChange(name);
        updateDomainName(name);
    };

    return (
        <>
            <Alert className="mb1" learnMore="https://protonmail.com/support/knowledge-base/custom-domains/">
                {c('Label for adding a new custom domain')
                    .t`Add a domain that you own to your ${MAIL_APP_NAME} account.`}
            </Alert>
            <Row>
                <Label htmlFor="domainName">{c('Label').t`Domain name`}</Label>
                <Field>
                    {domain.ID ? (
                        <span className="mt0-5 flex">{domainName}</span>
                    ) : (
                        <Input
                            id="domainName"
                            autoFocus
                            value={domainName}
                            placeholder={c('Placeholder').t`yourdomain.com`}
                            onChange={handleChange}
                            required
                        />
                    )}
                </Field>
            </Row>
            {!domain.ID && domainName.toLowerCase().startsWith('www.') ? (
                <Alert className="mb1" type="warning">{c('Domain modal')
                    .t`'www' subdomains are typically not used for email. Are you sure you want to use this domain value?`}</Alert>
            ) : null}
        </>
    );
};

DomainSection.propTypes = {
    domain: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default DomainSection;
