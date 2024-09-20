import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { useApi } from '@proton/components/hooks';
import { PASS_WEB_APP_URL } from '@proton/pass/constants';
import { TelemetrySecurityCenterEvents } from '@proton/shared/lib/api/telemetry';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import aliasSampleSvg from '@proton/styles/assets/img/illustrations/pass-aliases-alias-sample.svg';

import { sendSecurityCenterReport } from '../../securityCenterTelemetry';

interface Props {
    modalProps: ModalProps;
}

const TryProtonPass = ({ modalProps }: Props) => {
    const api = useApi();

    const onDismiss = () => {
        void sendSecurityCenterReport(api, {
            event: TelemetrySecurityCenterEvents.proton_pass_discover_banner,
            dimensions: { clicked_discover_pass: 'no' },
        });
        modalProps.onClose?.();
    };

    const onVisit = () => {
        void sendSecurityCenterReport(api, {
            event: TelemetrySecurityCenterEvents.proton_pass_discover_banner,
            dimensions: { clicked_discover_pass: 'yes' },
        });
        modalProps.onClose?.();
    };

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoContent>
                <div className="text-center pb-2 pt-4">
                    <img src={aliasSampleSvg} alt="" className="w-full mb-4" />
                    <h1 className="h2 text-bold">{c('Security Center').t`Try ${PASS_APP_NAME}`}</h1>
                    <p className="m-0 mt-2 color-weak">{c('Security Center')
                        .t`Generate aliases on the fly, and easily manage your aliases and passwords.`}</p>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={onDismiss}>{c('Action').t`Not now`}</Button>
                <ButtonLike as={Href} color="norm" href={PASS_WEB_APP_URL} onClick={onVisit}>{c('Security Center')
                    .t`Open ${PASS_APP_NAME}`}</ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default TryProtonPass;
