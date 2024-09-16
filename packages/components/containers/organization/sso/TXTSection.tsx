import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import type { Domain } from '@proton/shared/lib/interfaces';

import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import ReadonlyFieldWithCopy from './ReadonlyFieldWithCopy';

interface ReadOnlyInputFieldProps {
    label: string;
    value: string;
}

const ReadOnlyInputField: FC<ReadOnlyInputFieldProps> = ({ label, value }: ReadOnlyInputFieldProps) => {
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
    includeTimeInformation?: boolean;
}

const TXTSection = ({ domain, includeTimeInformation }: Props) => {
    const domainName = domain.DomainName;

    return (
        <div>
            <div>
                {getBoldFormattedText(
                    c('Info')
                        .t`To allow the domain **${domainName}** to use SAML SSO, you must verify ownership of it by adding the following DNS TXT record to your domain in your DNS provider.`
                )}
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
            {includeTimeInformation && (
                <div>{c('Info')
                    .t`This verification can take up to one hour. After successful verification, do not remove the TXT record as it is needed to confirm that you continue to own the domain.`}</div>
            )}
        </div>
    );
};

export default TXTSection;
