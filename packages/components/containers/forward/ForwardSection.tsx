import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, Href } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import Tabs from '@proton/components/components/tabs/Tabs';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useIncomingAddressForwardings, useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import forwardImg from '@proton/styles/assets/img/illustrations/new-upsells-img/forward.svg';
import isTruthy from '@proton/utils/isTruthy';

import ForwardModal from './ForwardModal';
import IncomingForwardTable from './IncomingForwardTable';
import OutgoingForwardTable from './OutgoingForwardTable';
import { getChainedForwardingEmails } from './forwardHelper';

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.FORWARD_EMAILS,
    isSettings: true,
});

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
                                    outgoingAddressForwardings={outgoingAddressForwardings}
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
                    title={c('Title').t`Ready, set, forward`}
                    description={c('Description')
                        .t`Set up auto-forwarding to redirect incoming emails to another email address.`}
                    modalProps={upsellModalProps}
                    illustration={forwardImg}
                    upsellRef={upsellRef}
                />
            )}
        </SettingsSectionWide>
    );
};

export default ForwardSection;
