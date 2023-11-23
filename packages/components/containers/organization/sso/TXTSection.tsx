import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { Href } from '@proton/atoms/Href';
import { Copy, Icon, InputFieldTwo } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Domain } from '@proton/shared/lib/interfaces';

interface Props {
    domain: Domain;
}

interface ReadOnlyInputFieldProps {
    label: string;
    value: string;
}

const ReadOnlyInputField: React.FC<ReadOnlyInputFieldProps> = ({ label, value }: ReadOnlyInputFieldProps) => {
    const { createNotification } = useNotifications();

    const onCopy = () => {
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    return (
        <InputFieldTwo
            label={c('Label').t`${label}`}
            value={value}
            readOnly
            inputContainerClassName="bg-weak rounded w-full"
            assistContainerClassName="hidden"
            rootClassName="flex flex-align-items-center flex-nowrap gap-2"
            labelContainerClassName="w-1/6 m-0"
            unstyled
            suffix={<Copy size="small" shape="ghost" color="weak" value={value} onCopy={onCopy} />}
        />
    );
};

const TXTSection = ({ domain }: Props) => {
    const domainName = <b key={domain.ID}>{domain.DomainName}</b>;

    return (
        <div>
            <p className="m-0">
                {c('Info')
                    .jt`To allow the domain ${domainName} to authenticate using SAML SSO, you must verify ownership of it by adding the following DNS TXT record to this domain.`}
            </p>
            <Href
                href={
                    // TODO:
                    getKnowledgeBaseUrl('/')
                }
            >
                {c('Link').t`Learn more`}
            </Href>

            <h3 className="text-semibold text-rg mt-2 mb-1">{c('Info').t`DNS TXT record`}</h3>
            <div className="rounded border border-weak flex flex-column gap-2 p-4">
                <ReadOnlyInputField label={c('Label').t`Type`} value="TXT" />
                <ReadOnlyInputField label={c('Label').t`Name`} value="@" />
                <ReadOnlyInputField label={c('Label').t`Value`} value={domain.VerifyCode} />
            </div>
            <p className="color-weak text-sm mt-2 mb-3">
                {c('Hint').t`Add this record to your domain in the control panel of your domain name registrar`}
            </p>

            <Card rounded className="flex flex-nowrap gap-2">
                <Icon name="info-circle" className="flex-item-noshrink mt-0.5" />
                <p className="m-0">
                    {c('Info')
                        .t`It can take up to a day for your domain ownership to be verified. After successful verification, do not remove the TXT record as it is needed to confirm that you continue to own the domain.`}
                </p>
            </Card>
        </div>
    );
};

export default TXTSection;
