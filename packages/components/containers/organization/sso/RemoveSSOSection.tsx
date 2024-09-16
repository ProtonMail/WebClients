import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { Domain, SSO } from '@proton/shared/lib/interfaces';

import { useModalState } from '../../../components';
import { SettingsParagraph, SettingsSection } from '../../account';
import RemoveSSOModal from './RemoveSSOModal';

interface Props {
    domain: Domain;
    ssoConfig: SSO;
}

const RemoveSSOSection = ({ domain, ssoConfig }: Props) => {
    const [removeSSOModalProps, setRemoveSSOModalOpen, renderRemoveSSOModal] = useModalState();

    const removeSSO = () => {
        setRemoveSSOModalOpen(true);
    };

    const boldDomainName = <b key={domain.ID}>{domain.DomainName}</b>;

    return (
        <>
            {renderRemoveSSOModal && <RemoveSSOModal sso={ssoConfig} {...removeSSOModalProps} />}
            <SettingsSection>
                <SettingsParagraph learnMoreUrl="https://protonvpn.com/support/sso">
                    {c('Info').jt`This will remove SSO for ${boldDomainName}.`}
                </SettingsParagraph>

                <Button color="danger" onClick={removeSSO}>
                    {c('Action').t`Stop using single sign-on`}
                </Button>
            </SettingsSection>
        </>
    );
};

export default RemoveSSOSection;
