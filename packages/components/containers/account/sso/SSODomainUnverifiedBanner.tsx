import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useCustomDomains } from '@proton/components/hooks';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';

import TXTRecordModal from '../../organization/sso/TXTRecordModal';
import TopBanner from '../../topBanners/TopBanner';

const SSODomainUnverifiedBanner = () => {
    const [customDomains] = useCustomDomains();
    const [modalProps, setModal, renderModal] = useModalState();

    if (!customDomains?.length) {
        return;
    }

    const unverifiedSSODomain = customDomains.find(
        (domain) => domain.Flags['sso-intent'] && domain.State !== DOMAIN_STATE.DOMAIN_STATE_VERIFIED
    );

    if (!unverifiedSSODomain || unverifiedSSODomain.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED) {
        return;
    }

    const domainStateMap: {
        [key in Exclude<DOMAIN_STATE, DOMAIN_STATE.DOMAIN_STATE_VERIFIED>]: { text: string; bgColor: string };
    } = {
        [DOMAIN_STATE.DOMAIN_STATE_DEFAULT]: {
            text: c('Info').t`Domain ownership not verified.`,
            bgColor: 'bg-warning',
        },
        [DOMAIN_STATE.DOMAIN_STATE_WARN]: {
            text: c('Info').t`Domain ownership failed verification.`,
            bgColor: 'bg-error',
        },
    };

    const { text, bgColor } = domainStateMap[unverifiedSSODomain.State];

    return (
        <>
            <TopBanner className={`${bgColor}`}>
                {text}{' '}
                <InlineLinkButton
                    key="button"
                    onClick={() => {
                        setModal(true);
                    }}
                >
                    {c('Action').t`Verify ${unverifiedSSODomain.DomainName}`}
                </InlineLinkButton>
            </TopBanner>
            {renderModal && <TXTRecordModal domain={unverifiedSSODomain} {...modalProps} />}
        </>
    );
};

export default SSODomainUnverifiedBanner;
