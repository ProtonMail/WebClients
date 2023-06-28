import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { SelfAuditResult } from '@proton/key-transparency/lib';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { SelfAuditAlertProps, getSelfAuditAlerts } from './SelfAuditAlerts';

export interface Props extends ModalProps {
    selfAuditResult: SelfAuditResult;
    appName: string;
    isAuditingOwnKeys: boolean;
}

const getDescriptionText = (isAuditingOwnKeys: boolean, appName: string) => {
    if (isAuditingOwnKeys) {
        return c('loc_nightly: Key transparency failure details')
            .t`${appName} periodically verifies that your keys are consistent with the public Key Transparency state.
Inconsistencies might cause other ${BRAND_NAME} users to use the wrong encryption keys when communicating with you. Please contact our customer support for more information.`;
    } else {
        return c('loc_nightly: Key transparency failure details')
            .t`${appName} verifies that the encryption keys of your contacts are consistent with the public Key Transparency state.
Inconsistencies might cause end-to-end encrypted data to be accessible to someone else than the intended recipient. Please contact our customer support for more information.`;
    }
};

const SelfAuditAlert = ({ email, warning, message }: SelfAuditAlertProps) => {
    const alertType = warning ? 'warning' : 'error';
    return (
        <Alert type={alertType}>
            <div className="flex flex-column flex-gap-0-5">
                <span className="text-strong text-break">{email}</span>
                <span>{message}</span>
            </div>
        </Alert>
    );
};

const KeyTransparencyDetailsModal = ({ selfAuditResult, appName, isAuditingOwnKeys, ...rest }: Props) => {
    const { onClose } = rest;
    const alerts = getSelfAuditAlerts(selfAuditResult, isAuditingOwnKeys, appName);
    return (
        <ModalTwo size="large" data-testid="key-transparency-details:modal" {...rest}>
            <ModalTwoHeader
                title={c('loc_nightly: Key transparency failure details').t`Key Transparency error details`}
            />
            <ModalTwoContent>
                <div className="flex flex-column">
                    <Alert className="mb-2" type="info">
                        <span className="mr-2">{getDescriptionText(isAuditingOwnKeys, appName)}</span>
                    </Alert>
                    {alerts.map((alert) => {
                        return (
                            <span key={alert.email} className="mb-2">
                                <SelfAuditAlert {...alert} />
                            </span>
                        );
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" color="norm" onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default KeyTransparencyDetailsModal;
