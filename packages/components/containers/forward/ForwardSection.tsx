import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import useIncomingAddressForwarding from '@proton/components/hooks/useIncomingAddressForwarding';
import useOutgoingAddressForwardings from '@proton/components/hooks/useOutgoingAddressForwardings';
import { APP_UPSELL_REF_PATH, BRAND_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import { MailUpsellButton, Tabs, UpsellModal, useModalState, useModalTwo } from '../../components';
import { useAddresses, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection, SettingsSectionWide } from '../account';
import { useFlag } from '../unleash';
import ForwardModal from './ForwardModal';
import IncomingForwardTable from './IncomingForwardTable';
import OutgoingForwardTable from './OutgoingForwardTable';
import { getChainedForwardingEmails } from './helpers';

const ForwardSection = () => {
    const [user] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const isEmailForwardingEnabled = useFlag('EmailForwarding');
    const [incomingAddressForwardings = [], loadingIncomingAddressForwardings] = useIncomingAddressForwarding();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();
    const chainedEmails = useMemo(() => {
        if (
            incomingAddressForwardings.length === 0 ||
            outgoingAddressForwardings.length === 0 ||
            addresses.length === 0
        ) {
            return [];
        }
        return getChainedForwardingEmails(incomingAddressForwardings, outgoingAddressForwardings, addresses);
    }, [incomingAddressForwardings, outgoingAddressForwardings, addresses]);
    const [activeTab, setActiveTab] = useState(0);
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();
    const [forwardModal, showModal] = useModalTwo(ForwardModal);
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.FORWARD_EMAILS,
        isSettings: true,
    });
    const isIncomingTableAvailable = incomingAddressForwardings.length > 0;
    const isOutgoingTableAvailable = isEmailForwardingEnabled && outgoingAddressForwardings.length > 0;

    return (
        <SettingsSectionWide className="no-scroll">
            <SettingsSection>
                <SettingsParagraph>
                    <span>
                        {c('email_forwarding_2023: Info')
                            .t`Forwarding to ${BRAND_NAME} addresses will keep your communication end-to-end encrypted. When forwarding externally, encryption might need to be removed.`}
                    </span>
                    <br />
                    <Href href={getKnowledgeBaseUrl('/email-forwarding')}>{c('email_forwarding_2023: Link')
                        .t`Learn more`}</Href>
                </SettingsParagraph>

                {isEmailForwardingEnabled ? (
                    <div className="mb-4">
                        {user.hasPaidMail ? (
                            <Button color="norm" onClick={() => showModal(true)}>{c('email_forwarding_2023: Action')
                                .t`Add forwarding rule`}</Button>
                        ) : (
                            <MailUpsellButton
                                onClick={() => handleUpsellModalDisplay(true)}
                                text={c('email_forwarding_2023: Action').t`Set up email forwarding`}
                            />
                        )}
                    </div>
                ) : null}
                <Tabs
                    tabs={[
                        isOutgoingTableAvailable && {
                            title: c('email_forwarding_2023: Incoming forwarding tab name').t`From me`,
                            content: (
                                <OutgoingForwardTable
                                    addresses={addresses}
                                    forwardings={outgoingAddressForwardings}
                                    chainedEmails={chainedEmails}
                                    loading={loadingAddresses && loadingIncomingAddressForwardings}
                                    user={user}
                                />
                            ),
                        },
                        isIncomingTableAvailable && {
                            title: c('email_forwarding_2023: Outgoing forwarding tab name').t`To me`,
                            content: (
                                <IncomingForwardTable
                                    addresses={addresses}
                                    forwardings={incomingAddressForwardings}
                                    chainedEmails={chainedEmails}
                                    loading={loadingAddresses && loadingOutgoingAddressForwardings}
                                />
                            ),
                        },
                    ].filter(isTruthy)}
                    value={activeTab}
                    onChange={setActiveTab}
                />
            </SettingsSection>
            {forwardModal}
            {renderUpsellModal && (
                <UpsellModal
                    title={c('email_forwarding_2023: Title').t`Automatically forward emails to other accounts`}
                    description={c('email_forwarding_2023: Description')
                        .t`Unlock email forwarding to easily manage incoming information and more premium features when you upgrade.`}
                    modalProps={upsellModalProps}
                    upsellRef={upsellRef}
                    features={[
                        'more-storage',
                        'more-email-addresses',
                        'unlimited-folders-and-labels',
                        'custom-email-domains',
                    ]}
                />
            )}
        </SettingsSectionWide>
    );
};

export default ForwardSection;
