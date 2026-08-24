import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { useAddressesKeys } from '@proton/account/addressKeys/hooks';
import { getHasAccountKeyChangeBlockingDelegatedAccess } from '@proton/account/delegatedAccess/accountKeyChangeBlocking';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import useIsMounted from '@proton/hooks/useIsMounted';
import useLoading from '@proton/hooks/useLoading';
import { IcLink } from '@proton/icons/icons/IcLink';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { querySessions } from '@proton/shared/lib/api/auth';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import { useModalTwoStatic } from '../../../components/modalTwo/useModalTwo';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSection from '../../account/SettingsSection';
import SettingsSectionTitle from '../../account/SettingsSectionTitle';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import type { Session } from '../../sessions/interface';
import PostQuantumOptInModal, { PostQuantumSetupStep } from './PostQuantumOptInModal';

const PostQuantumKeysOptInSection = () => {
    const isMounted = useIsMounted();
    const [state, setState] = useState<{ pqcIncompatibleState: boolean }>({ pqcIncompatibleState: true });
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const [userSettings] = useUserSettings(); // loading state not needed since settings are prefetched in bootstrap
    const [optInModal, showOptInModal] = useModalTwoStatic(PostQuantumOptInModal);
    const { createNotification } = useNotifications();
    const [userKeys = [], loadingUserKeys] = useUserKeys();
    const [addresses = [], loadingAddressesKeys] = useAddressesKeys();
    const [loadingWhileOptin, withLoadingWhileOptin] = useLoading();
    const dispatch = useDispatch();

    useEffect(() => {
        if (userSettings.Flags.SupportPgpV6Keys) {
            return;
        }
        const checkSessionsAndDelegatedAccesses = async () => {
            const [{ Sessions }, hasAccountKeyChangeBlockingDelegatedAccess] = await Promise.all([
                api<{ Sessions: Session[] }>(querySessions()),
                dispatch(getHasAccountKeyChangeBlockingDelegatedAccess()),
            ]);
            if (isMounted()) {
                setState({
                    pqcIncompatibleState:
                        hasAccountKeyChangeBlockingDelegatedAccess ||
                        Sessions.some(({ PgpV6Capable }) => PgpV6Capable === false),
                });
            }
        };
        void withLoading(checkSessionsAndDelegatedAccesses()).catch(noop);
    }, []);

    if (loading || loadingUserKeys || loadingAddressesKeys) {
        // copied from PrivateMainAreaLoading
        return (
            <>
                <SettingsSectionTitle className="settings-loading-section-title" />
                <SettingsSection>
                    <SettingsParagraph className="mb-4">
                        <span className="block settings-loading-paragraph-line" />
                        <span className="block settings-loading-paragraph-line" />
                        <span className="block settings-loading-paragraph-line" />
                    </SettingsParagraph>
                </SettingsSection>
            </>
        );
    }

    // section title rendering is handled here temporarily, since it depends on whether the section is shown,
    // based on the sessions
    const id = 'pqc-optin';
    const title = c('Title').t`Post-quantum protection`;
    // handle with key setup issues: allow resuming key generation if we detect a missing account PQC key
    // or address key. No need to check for PQC key algo since v6 keys can only be imported after opt-in.
    const needsResumeGeneratePQCAccountKey =
        !!userSettings.Flags.SupportPgpV6Keys && !!userKeys[0] && !userKeys[0].privateKey.isPrivateKeyV6();
    const needsResumeGeneratePQCAddressKeys =
        needsResumeGeneratePQCAccountKey ||
        (!!userSettings.Flags.SupportPgpV6Keys &&
            addresses.some(({ keys: addressKeys }) =>
                addressKeys.every(({ privateKey }) => !privateKey.isPrivateKeyV6())
            ));
    let resumeKeyGenerationStep;
    if (needsResumeGeneratePQCAccountKey) {
        resumeKeyGenerationStep = PostQuantumSetupStep.IN_PROGRESS_ACCOUNT_KEY;
    } else if (needsResumeGeneratePQCAddressKeys) {
        resumeKeyGenerationStep = PostQuantumSetupStep.IN_PROGRESS_ADDRESS_KEYS;
    }

    const handleLinkClick = () => {
        const hash = document.location.hash;
        const dehashedHref = document.location.href.replace(hash, '');

        const urlToCopy = `${dehashedHref}#${id}`;
        textToClipboard(urlToCopy);

        createNotification({
            text: c('Info').t`Link copied to clipboard`,
        });
    };

    const linkElement = (
        <Link
            to={`#${id}`}
            onClick={handleLinkClick}
            className="sub-settings-section-anchor absolute group-hover:opacity-100"
            aria-hidden="true"
            tabIndex={-1}
        >
            <IcLink />
        </Link>
    );

    const sectionTitleElement = (
        <SettingsSectionTitle className="group-hover-opacity-container relative">
            {linkElement}
            <span>{title}</span>
        </SettingsSectionTitle>
    );

    return (
        <>
            {optInModal}
            {!!userSettings.Flags.SupportPgpV6Keys ? (
                <>
                    {sectionTitleElement}
                    {loadingWhileOptin ? (
                        <SettingsSection>
                            <SettingsParagraph className="mb-4">
                                <span className="block settings-loading-paragraph-line" />
                                <span className="block settings-loading-paragraph-line" />
                                <span className="block settings-loading-paragraph-line" />
                            </SettingsParagraph>
                        </SettingsSection>
                    ) : (
                        <SettingsSectionWide>
                            <SettingsParagraph>
                                {c('Info').t`Support for post-quantum keys is enabled for your account.`}
                            </SettingsParagraph>
                            {resumeKeyGenerationStep && (
                                <SettingsParagraph>
                                    {c('Info')
                                        .t`To enable post-quantum protection, you’ll need to finish generating your new post-quantum encryption keys.`}
                                </SettingsParagraph>
                            )}
                            {resumeKeyGenerationStep && (
                                <div className="mb-4">
                                    <Button
                                        shape="outline"
                                        onClick={() =>
                                            showOptInModal({
                                                resumeKeyGenerationStep,
                                                withLoadingWhileInProgress: withLoadingWhileOptin,
                                            })
                                        }
                                        data-testid="postQuantumResumeKeyGeneration"
                                    >
                                        {c('Action').t`Generate missing keys`}
                                    </Button>
                                </div>
                            )}
                        </SettingsSectionWide>
                    )}
                </>
            ) : (
                !state.pqcIncompatibleState && (
                    <>
                        {sectionTitleElement}
                        <SettingsSectionWide>
                            <SettingsParagraph>
                                {c('Info')
                                    .t`Protect your account from quantum computing threats with quantum-resistant cryptographic keys.`}
                            </SettingsParagraph>
                            {
                                <div className="mb-4">
                                    <Button
                                        shape="outline"
                                        onClick={() =>
                                            showOptInModal({ withLoadingWhileInProgress: withLoadingWhileOptin })
                                        }
                                        data-testid="postQuantumOptIn"
                                    >
                                        {c('Action').t`Enable post-quantum protection`}
                                    </Button>
                                </div>
                            }
                        </SettingsSectionWide>
                    </>
                )
            )}
        </>
    );
};
export default PostQuantumKeysOptInSection;
