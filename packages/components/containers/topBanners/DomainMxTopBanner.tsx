import { useEffect, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useDomainsAddresses } from '@proton/account/domainsAddresses/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getHasAddressMissingProtonMX, getIsDomainMxScanNeeded } from '@proton/shared/lib/organization/domain';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import SettingsLink from '../../components/link/SettingsLink';
import useModalState from '../../components/modalTwo/useModalState';
import DomainMxHideModal from './DomainMxHideModal';
import TopBanner from './TopBanner';

const noSkippedDomainIDs: string[] = [];

/** Resolves to an empty list when the feature is missing or cannot be read, so the banner still shows. */
const useSkippedDomainIDs = () => {
    const { feature, get, update } = useFeature<string[]>(FeatureCode.MailSkipMissingDomainMX, false);
    const [isRead, setIsRead] = useState(false);

    useEffect(() => {
        void get()
            .catch(noop)
            .finally(() => setIsRead(true));
    }, []);

    const skipDomainIDs = (domainIDs: string[]) => {
        update([...(feature?.Value ?? []), ...domainIDs]).catch(noop);
    };

    const skippedDomainIDs = isRead ? (feature?.Value ?? noSkippedDomainIDs) : undefined;
    return [skippedDomainIDs, skipDomainIDs] as const;
};

const DomainMxBanner = () => {
    const [domains] = useCustomDomains();
    const [skippedDomainIDs, skipDomainIDs] = useSkippedDomainIDs();
    const domainsToScan = useMemo(() => {
        if (!skippedDomainIDs) {
            return undefined;
        }
        return domains?.filter((domain) => getIsDomainMxScanNeeded(domain) && !skippedDomainIDs.includes(domain.ID));
    }, [domains, skippedDomainIDs]);
    const [addressesByDomainID, loading] = useDomainsAddresses(domainsToScan);
    const [hideModalProps, setHideModalOpen, renderHideModal] = useModalState();

    if (!domainsToScan || loading) {
        return null;
    }

    const domainsMissingProtonMX = domainsToScan.filter((domain) => {
        const addresses = addressesByDomainID[domain.ID];
        return addresses !== undefined && getHasAddressMissingProtonMX(addresses);
    });

    if (!domainsMissingProtonMX.length) {
        return null;
    }

    const activateLink = (
        <SettingsLink key="activate-mail" className="color-inherit" path="/domain-names">
            {c('Link').t`Activate`}
        </SettingsLink>
    );

    const getInvitation = () => {
        if (domainsMissingProtonMX.length === 1) {
            const domainName = domainsMissingProtonMX[0].DomainName;
            return c('Info').jt`Activate ${MAIL_APP_NAME} to start receiving emails at ${domainName}. ${activateLink}`;
        }

        const count = domainsMissingProtonMX.length;
        return (
            <>
                {c('Info').ngettext(
                    msgid`Activate ${MAIL_APP_NAME} to start receiving emails at ${count} of your domains.`,
                    `Activate ${MAIL_APP_NAME} to start receiving emails at ${count} of your domains.`,
                    count
                )}{' '}
                {activateLink}
            </>
        );
    };

    const handleHide = () => {
        setHideModalOpen(false);
        skipDomainIDs(domainsMissingProtonMX.map(({ ID }) => ID));
    };

    return (
        <>
            <TopBanner className="bg-danger" onClose={() => setHideModalOpen(true)}>
                {getInvitation()}
            </TopBanner>
            {renderHideModal && (
                <DomainMxHideModal domains={domainsMissingProtonMX} onHide={handleHide} {...hideModalProps} />
            )}
        </>
    );
};

const DomainMxTopBanner = () => {
    const isEnabled = useFlag('MailDomainMxTopBanner');

    if (!isEnabled) {
        return null;
    }

    return <DomainMxBanner />;
};

export default DomainMxTopBanner;
