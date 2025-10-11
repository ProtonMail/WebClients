import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import type { IconName } from '@proton/icons/types';
import type { Domain } from '@proton/shared/lib/interfaces';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

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

    const domainStateMap: { [key in DOMAIN_STATE]: { text: string; className: string; iconName: IconName } } = {
        [DOMAIN_STATE_DEFAULT]: {
            text: c('Info').t`Domain ownership not verified.`,
            className: 'color-warning',
            iconName: 'cross-circle-filled',
        },
        [DOMAIN_STATE_VERIFIED]: {
            text: c('Info').t`Domain ownership verified.`,
            className: 'color-success',
            iconName: 'checkmark-circle-filled',
        },
        [DOMAIN_STATE_WARN]: {
            text: c('Info').t`Domain ownership failed verification.`,
            className: 'color-error',
            iconName: 'cross-circle-filled',
        },
    };

    const domainStateProperties = domainStateMap[domain.State];

    if (!domainStateProperties) {
        return null;
    }

    const { text, className, iconName } = domainStateProperties;

    return (
        <>
            {renderTXTRecordModal && (
                <TXTRecordModal ssoAppInfo={ssoAppInfo} domain={domain} {...txtRecordModalProps} />
            )}

            <div className="flex gap-1 flex-nowrap">
                <Icon className={clsx('shrink-0', className)} type="warning" name={iconName} />
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
