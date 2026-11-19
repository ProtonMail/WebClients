import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { useIncomingAddressForwardings, useOutgoingAddressForwardings } from '@proton/mail/store/forwarding/hooks';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/ref';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import forwardImg from '@proton/styles/assets/img/illustrations/new-upsells-img/forward.svg';
import isTruthy from '@proton/utils/isTruthy';

import useModalState from '../../components/modalTwo/useModalState';
import { useModalTwoStatic } from '../../components/modalTwo/useModalTwo';
import { Tabs } from '../../components/tabs/Tabs';
import MailUpsellButton from '../../components/upsell/MailUpsellButton';
import UpsellModal from '../../components/upsell/UpsellModal/UpsellModal';
import { SettingsCardSection } from '../account/SettingsCardSection';
import { SettingsLayoutVariant } from '../layout/interface';
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
        <>
            <SettingsCardSection
                flush
                title={c('Title').t`Forward emails`}
                description={
                    <>
                        {c('email_forwarding_2023: Info').t`Automatically forward emails to another email address.`}{' '}
                        <Href href={getKnowledgeBaseUrl('/email-forwarding')}>{c('email_forwarding_2023: Link')
                            .t`Learn more`}</Href>
                    </>
                }
                actions={
                    user.hasPaidMail ? (
                        <Button color="norm" onClick={() => showForwardModal({})}>
                            {c('email_forwarding_2023: Action').t`Add forwarding rule`}
                        </Button>
                    ) : (
                        <MailUpsellButton
                            onClick={() => handleUpsellModalDisplay(true)}
                            text={c('email_forwarding_2023: Action').t`Set up email forwarding`}
                        />
                    )
                }
            >
                {(isOutgoingTableAvailable || isIncomingTableAvailable) && (
                    <Tabs
                        // The card is flush for the tables: pad the tab bar instead
                        navContainerClassName="px-4 pt-2"
                        tabs={[
                            isOutgoingTableAvailable && {
                                title: c('email_forwarding_2023: Incoming forwarding tab name').t`From me`,
                                content: (
                                    <OutgoingForwardTable
                                        variant={SettingsLayoutVariant.Card}
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
                                        variant={SettingsLayoutVariant.Card}
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
                )}
            </SettingsCardSection>
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
        </>
    );
};

export default ForwardSection;
