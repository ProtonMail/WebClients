import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import UpsellModal from '@proton/components/components/upsell/modal/UpsellModal';
import { useIncomingAddressForwardings, useOutgoingAddressForwardings } from '@proton/components/hooks';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

import { Tabs } from '../../components';
import { useAddresses, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSection, SettingsSectionWide } from '../account';
import ForwardModal from './ForwardModal';
import IncomingForwardTable from './IncomingForwardTable';
import OutgoingForwardTable from './OutgoingForwardTable';
import { getChainedForwardingEmails } from './helpers';

const ForwardSection = () => {
    const location = useLocation();
    const hash = location.hash;
    const [user] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const [incomingAddressForwardings = [], loadingIncomingAddressForwardings] = useIncomingAddressForwardings();
    const [outgoingAddressForwardings = [], loadingOutgoingAddressForwardings] = useOutgoingAddressForwardings();
    const isIncomingTableAvailable = incomingAddressForwardings.length > 0;
    const isOutgoingTableAvailable = outgoingAddressForwardings.length > 0;
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
    const [forwardModal, showForwardModal] = useModalTwoStatic(ForwardModal);
    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.FORWARD_EMAILS,
        isSettings: true,
    });

    // Focus incoming tab if hash is #forward
    useEffect(() => {
        if (hash === '#forward' && isIncomingTableAvailable && isOutgoingTableAvailable) {
            setActiveTab(1); // Incoming tab is second
            location.hash = '';
        }
    }, [hash, isIncomingTableAvailable, isOutgoingTableAvailable]);

    return (
        <SettingsSectionWide className="overflow-hidden">
            <SettingsSection>
                <SettingsParagraph>
                    <span>
                        {c('email_forwarding_2023: Info').t`Automatically forward emails to another email address.`}
                    </span>
                    <br />
                    <Href href={getKnowledgeBaseUrl('/email-forwarding')}>{c('email_forwarding_2023: Link')
                        .t`Learn more`}</Href>
                </SettingsParagraph>

                <div className="mb-4">
                    {user.hasPaidMail ? (
                        <Button color="norm" onClick={() => showForwardModal({})}>
                            {c('email_forwarding_2023: Action').t`Add forwarding rule`}
                        </Button>
                    ) : (
                        <MailUpsellButton
                            onClick={() => handleUpsellModalDisplay(true)}
                            text={c('email_forwarding_2023: Action').t`Set up email forwarding`}
                        />
                    )}
                </div>
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
                    upgradePath={addUpsellPath(getUpgradePath({ user }), upsellRef)}
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
