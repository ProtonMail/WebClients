import { useState } from 'react';

import { c } from 'ttag';

import KeyTransparencyDetailsModal from '@proton/components/components/keyTransparency/KeyTransparencyDetailsModal';
import { AddressAuditStatus, SelfAuditResult } from '@proton/key-transparency/lib';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

import { useConfig, useModalState } from '../..';
import { useKeyTransparencyContext } from '../keyTransparency/useKeyTransparencyContext';
import TopBanner from './TopBanner';

const getHasSelfAuditWarning = (selfAuditResult: SelfAuditResult, isAuditingOwnKeys: boolean) => {
    if (isAuditingOwnKeys) {
        const hasSomeSelfAuditUnsuccessful = selfAuditResult.addressAuditResults.some(
            ({ status }) => status !== AddressAuditStatus.Success
        );
        if (hasSomeSelfAuditUnsuccessful) {
            return true;
        }
    }
    const localStorageAuditResults = isAuditingOwnKeys
        ? selfAuditResult.localStorageAuditResultsOwnAddress
        : selfAuditResult.localStorageAuditResultsOtherAddress;

    return localStorageAuditResults.some(({ success }) => !success);
};

const KeyTransparencyErrorTopBannerComponent = ({ isAuditingOwnKeys }: { isAuditingOwnKeys: boolean }) => {
    const [ignore, setIgnore] = useState(false);

    const [keyTransparencyDetailsModalProps, keyTransparencyDetailsModalOpen] = useModalState();

    const {
        ktState: { selfAuditResult },
        ktActivation,
    } = useKeyTransparencyContext();

    const { APP_NAME } = useConfig();

    const showWarning =
        !ignore &&
        ktActivation === KeyTransparencyActivation.SHOW_UI &&
        selfAuditResult &&
        getHasSelfAuditWarning(selfAuditResult, isAuditingOwnKeys);

    if (!showWarning) {
        return null;
    }

    const appName = getAppName(APP_NAME);

    const detailsButton = (
        <button
            key="enable-desktop-notifications"
            className="link align-baseline text-left"
            type="button"
            onClick={() => keyTransparencyDetailsModalOpen(true)}
        >
            {c('Key transparency details button').jt`Click here for more details.`}
        </button>
    );

    const text = isAuditingOwnKeys
        ? c('loc_nightly: Warning').jt`${appName} detected an issue with your encryption keys. ${detailsButton}`
        : c('loc_nightly: Warning')
              .jt`${appName} detected an issue with the encryption keys of your contact. ${detailsButton}`;

    return (
        <>
            <TopBanner onClose={() => setIgnore(true)} className="bg-warning">
                {text}
            </TopBanner>
            <KeyTransparencyDetailsModal
                selfAuditResult={selfAuditResult}
                isAuditingOwnKeys={isAuditingOwnKeys}
                appName={appName}
                {...keyTransparencyDetailsModalProps}
            />
        </>
    );
};

const KeyTransparencyErrorTopBanner = () => {
    return (
        <>
            <KeyTransparencyErrorTopBannerComponent isAuditingOwnKeys={true} />
            <KeyTransparencyErrorTopBannerComponent isAuditingOwnKeys={false} />
        </>
    );
};

export default KeyTransparencyErrorTopBanner;
