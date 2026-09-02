import type { ReactNode } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import type { Domain } from '@proton/shared/lib/interfaces';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';

import useModalState from '../../../components/modalTwo/useModalState';
import TXTRecordModal from './TXTRecordModal';
import type { SsoAppInfo } from './ssoAppInfo';

interface Props {
    domain: Domain;
    ssoAppInfo: SsoAppInfo;
}

const { DOMAIN_STATE_DEFAULT, DOMAIN_STATE_VERIFIED, DOMAIN_STATE_WARN } = DOMAIN_STATE;

const DomainVerificationState = ({ domain, ssoAppInfo }: Props) => {
    const [txtRecordModalProps, setTXTRecordModalOpen, renderTXTRecordModal] = useModalState();

    const showTXT = () => {
        setTXTRecordModalOpen(true);
    };

    const domainStateMap: { [key in DOMAIN_STATE]: { text: string; icon: ReactNode } } = {
        [DOMAIN_STATE_DEFAULT]: {
            text: c('Info').t`Domain ownership not verified.`,
            icon: <IcCrossCircleFilled className="shrink-0 color-warning" />,
        },
        [DOMAIN_STATE_VERIFIED]: {
            text: c('Info').t`Domain ownership verified.`,
            icon: <IcCheckmarkCircleFilled className="shrink-0 color-success" />,
        },
        [DOMAIN_STATE_WARN]: {
            text: c('Info').t`Domain ownership failed verification.`,
            icon: <IcCrossCircleFilled className="shrink-0 color-error" />,
        },
    };

    const domainStateProperties = domainStateMap[domain.State];

    if (!domainStateProperties) {
        return null;
    }

    const { text, icon } = domainStateProperties;

    return (
        <>
            {renderTXTRecordModal && (
                <TXTRecordModal ssoAppInfo={ssoAppInfo} domain={domain} {...txtRecordModalProps} />
            )}

            <div className="flex gap-1 flex-nowrap">
                {icon}
                <span>
                    {text}{' '}
                    <InlineLinkButton className="color-inherit" onClick={() => showTXT()}>
                        {c('Action').t`See DNS TXT record`}
                    </InlineLinkButton>
                </span>
            </div>
        </>
    );
};

export default DomainVerificationState;
