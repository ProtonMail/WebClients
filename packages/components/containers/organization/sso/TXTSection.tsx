import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Domain } from '@proton/shared/lib/interfaces';

import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';

interface ReadOnlyInputFieldProps {
    label: string;
    value: string;
}

const ReadOnlyInputField: React.FC<ReadOnlyInputFieldProps> = ({ label, value }: ReadOnlyInputFieldProps) => {
    return (
        <ReadonlyFieldWithCopy
            label={label}
            value={value}
            assistContainerClassName="hidden"
            rootClassName="flex items-center flex-nowrap gap-2"
            labelContainerClassName="w-1/6 m-0"
        />
    );
};

interface Props {
    domain: Domain;
}

const TXTSection = ({ domain }: Props) => {
    const boldDomainName = <b key={domain.ID}>{domain.DomainName}</b>;

    return (
        <div>
            <div>
                {c('Info')
                    .jt`To allow the domain ${boldDomainName} to use SAML SSO, you must verify ownership of it by adding the following DNS TXT record to your domain in your DNS provider.`}
            </div>
            <Href href="https://protonvpn.com/support/sso">{c('Link').t`Learn more`}</Href>

            <h3 className="text-semibold text-rg mt-4 mb-1">{c('Info').t`DNS TXT record`}</h3>
            <div className="rounded border border-weak flex flex-column gap-2 p-4">
                <ReadOnlyInputField label={c('Label').t`Type`} value="TXT" />
                <ReadOnlyInputField label={c('Label').t`Name`} value="@" />
                <ReadOnlyInputField label={c('Label').t`Value`} value={domain.VerifyCode} />
            </div>
            <p className="color-weak text-sm mt-1">
                {c('Hint').t`Add this record to your domain in the control panel of your domain name registrar`}
            </p>
        </div>
    );
};

export default TXTSection;
