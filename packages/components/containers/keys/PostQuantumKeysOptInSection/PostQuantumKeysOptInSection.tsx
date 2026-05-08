import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { Button } from '@proton/atoms/Button/Button';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useIsMounted from '@proton/hooks/useIsMounted';
import useLoading from '@proton/hooks/useLoading';
import { IcLink } from '@proton/icons/icons/IcLink';
import { querySessions } from '@proton/shared/lib/api/auth';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import SettingsSection from '../../account/SettingsSection';
import SettingsSectionTitle from '../../account/SettingsSectionTitle';
import type { Session } from '../../sessions/interface';
import PostQuantumOptInModal from './PostQuantumOptInModal';

const PostQuantumKeysOptInSection = () => {
    const isMounted = useIsMounted();
    const [state, setState] = useState<{ pqcIncompatibleSessions: boolean }>({ pqcIncompatibleSessions: true });
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const [userSettings] = useUserSettings(); // loading state not needed since settings are prefetched in bootstrap
    const [optInModal, showOptInModal] = useModalTwoStatic(PostQuantumOptInModal);
    const { createNotification } = useNotifications();

    useEffect(() => {
        const fetchSessions = async () => {
            const { Sessions } = await api<{ Sessions: Session[] }>(querySessions());
            if (isMounted()) {
                setState({
                    pqcIncompatibleSessions: Sessions.some(({ PgpV6Capable }) => PgpV6Capable === false),
                });
            }
        };
        void withLoading(fetchSessions()).catch(noop);
    }, []);

    if (loading) {
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
                    <SettingsSectionWide>
                        <SettingsParagraph>
                            {c('Info').t`Support for post-quantum keys is enabled for your account.`}
                        </SettingsParagraph>
                    </SettingsSectionWide>
                </>
            ) : (
                !state.pqcIncompatibleSessions && (
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
                                        onClick={() => showOptInModal({})}
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
