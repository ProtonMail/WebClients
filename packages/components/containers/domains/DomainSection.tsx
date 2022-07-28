import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Domain } from '@proton/shared/lib/interfaces';

import { Alert, InputFieldTwo } from '../../components';

interface Props {
    domain: Partial<Domain>;
    domainName: string;
    onValue: (domainName: string) => void;
    validator: (validations: string[]) => string;
}

const DomainSection = ({ domain, domainName, onValue, validator }: Props) => {
    return (
        <>
            <Alert className="mb1" learnMore={getKnowledgeBaseUrl('/custom-domain')}>
                {c('Label for adding a new custom domain')
                    .t`Add a domain that you own to your ${MAIL_APP_NAME} account.`}
            </Alert>
            {domain.ID ? (
                <InputFieldTwo label={c('Label').t`Domain name`} as="div">
                    {domainName}
                </InputFieldTwo>
            ) : (
                <InputFieldTwo
                    id="domainName"
                    rootClassName="max-w18e"
                    label={c('Label').t`Domain name`}
                    error={validator([requiredValidator(domainName)])}
                    autoFocus
                    value={domainName}
                    onValue={onValue}
                    placeholder={c('Placeholder').t`yourdomain.com`}
                />
            )}
            {!domain.ID && domainName.toLowerCase().startsWith('www.') ? (
                <Alert className="mb1" type="warning">{c('Domain modal')
                    .t`'www' subdomains are typically not used for email. Are you sure you want to use this domain value?`}</Alert>
            ) : null}
        </>
    );
};

export default DomainSection;
