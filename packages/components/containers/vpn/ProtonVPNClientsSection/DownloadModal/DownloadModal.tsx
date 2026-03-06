import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { getDownloadAppText } from '@proton/components/containers/account/dashboard/shared/DashboardMoreInfoSection/helpers';
import OnboardingContent from '@proton/components/containers/onboarding/OnboardingContent';
import { ModalTwo, ModalTwoContent } from '@proton/components/index';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';

import { getOsDownloadUrl } from '../getOsDownloadUrl';

interface DownloadModalProps extends ModalProps {
    downloadUrl: string;
}

const DownloadModal = ({ downloadUrl, ...rest }: DownloadModalProps) => {
    return (
        <ModalTwo {...rest} size="small">
            <ModalTwoContent className="m-8 text-center">
                <OnboardingContent
                    img={<img src={onboardingVPNWelcome} alt={getWelcomeToText(VPN_APP_NAME)} />}
                    title={getDownloadAppText(VPN_APP_NAME)}
                    description={c('Info').t`The securest way to browse, stream, and be online.`}
                />
                <ButtonLike
                    as={Href}
                    color="norm"
                    size="large"
                    target="_blank"
                    href={getOsDownloadUrl()}
                    fullWidth
                    onClick={() => {
                        rest.onClose?.();
                    }}
                    className="mb-2"
                >{c('Action').t`Download`}</ButtonLike>
                <Button color="norm" size="large" fullWidth shape="ghost" onClick={rest.onClose}>
                    {c('Action').t`Close`}
                </Button>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default DownloadModal;
