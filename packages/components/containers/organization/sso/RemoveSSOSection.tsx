import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { Domain, SSO } from '@proton/shared/lib/interfaces';

import useModalState from '../../../components/modalTwo/useModalState';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSection from '../../account/SettingsSection';
import RemoveSSOModal from './RemoveSSOModal';
import type { SsoAppInfo } from './ssoAppInfo';

interface Props {
    domain: Domain;
    ssoConfig: SSO;
    ssoAppInfo: SsoAppInfo;
}

const RemoveSSOSection = ({ domain, ssoConfig, ssoAppInfo }: Props) => {
    const [removeSSOModalProps, setRemoveSSOModalOpen, renderRemoveSSOModal] = useModalState();

    const removeSSO = () => {
        setRemoveSSOModalOpen(true);
    };

    const boldDomainName = <b key={domain.ID}>{domain.DomainName}</b>;

    return (
        <>
            {renderRemoveSSOModal && (
                <RemoveSSOModal sso={ssoConfig} ssoAppInfo={ssoAppInfo} {...removeSSOModalProps} />
            )}
            <SettingsSection>
                <SettingsParagraph learnMoreUrl={ssoAppInfo.kbUrl}>
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
