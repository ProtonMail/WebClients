import { type FC, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Info, type ModalStateProps, useModalState } from '@proton/components';
import stamp from '@proton/pass/assets/alias/alias-contact-stamp.svg';
import { ContactCard } from '@proton/pass/components/Item/Alias/Contact/ContactCard';
import { SidebarCreateContact } from '@proton/pass/components/Item/Alias/Contact/SidebarCreateContact';
import { SidebarMoreInfoFlow } from '@proton/pass/components/Item/Alias/Contact/SidebarMoreInfoFlow';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { aliasGetContactsList } from '@proton/pass/store/actions';
import type { AliasContactGetResponse, AliasContactWithStatsGetResponse, UniqueItem } from '@proton/pass/types';

type Props = UniqueItem & Pick<ModalStateProps, 'onClose'>;

export const SidebarContactsView: FC<Props> = ({ onClose, itemId, shareId }) => {
    const [createContact, openCreateContactSidebar] = useModalState();
    const [moreInfoFlow, openMoreInfoFlowSidebar] = useModalState();
    const [allContacts, setAllContacts] = useState<AliasContactWithStatsGetResponse[]>([]);

    const { loading, dispatch } = useRequest(aliasGetContactsList, {
        initial: { shareId, itemId },
        onSuccess: ({ data }) => setAllContacts(data),
    });

    const hasContacts = allContacts.length > 0;
    const { contacts, blockedContacts } = useMemo(
        () => Object.groupBy(allContacts ?? [], (contact) => (contact.Blocked ? 'blockedContacts' : 'contacts')),
        [allContacts]
    );

    const handleContactCreated = (contact: AliasContactGetResponse) => {
        const newContact = { ...contact, RepliedEmails: 0, ForwardedEmails: 0, BlockedEmails: 0 };
        setAllContacts((prev) => [...prev, newContact]);
    };

    const handleContactDeleted = (ID: number) => {
        setAllContacts((prev) => prev.filter((contact) => contact.ID !== ID));
    };

    const handleContactUpdated = (updatedContact: AliasContactGetResponse) => {
        setAllContacts((prev) =>
            prev.map((contact) => (contact.ID === updatedContact.ID ? { ...contact, ...updatedContact } : contact))
        );
    };

    const getContactProps = (contact: AliasContactWithStatsGetResponse) => ({
        shareId,
        itemId,
        ...contact,
        onContactDeleted: handleContactDeleted,
        onContactUpdated: handleContactUpdated,
    });

    useEffect(() => dispatch({ shareId, itemId }), []);

    return (
        <>
            <SidebarModal className="ui-teal" onClose={onClose} open>
                <Panel
                    className="pass-panel--full"
                    header={
                        <PanelHeader
                            actions={[
                                <Button
                                    key="cancel-button"
                                    icon
                                    pill
                                    shape="solid"
                                    color="weak"
                                    onClick={onClose}
                                    title={c('Action').t`Cancel`}
                                >
                                    <Icon name="cross" alt={c('Action').t`Cancel`} />
                                </Button>,
                                <Button
                                    color="norm"
                                    key="modal-submit-button"
                                    pill
                                    onClick={() => openCreateContactSidebar(true)}
                                >
                                    {c('Action').t`Create contact`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <div className="flex items-center mb-4">
                        <h2 className="text-xl text-bold mr-1">{c('Title').t`Contacts`}</h2>
                        <Info
                            title={c('Info').t`See more info`}
                            className="color-norm"
                            questionMark
                            filled
                            onClick={() => openMoreInfoFlowSidebar(true)}
                            size={5}
                        />
                    </div>

                    {loading ? (
                        <>
                            <div
                                className="pass-skeleton pass-skeleton--box mt-2"
                                style={{ '--skeleton-height': '2rem' }}
                            />
                            <div
                                className="pass-skeleton pass-skeleton--box mt-2"
                                style={{ '--skeleton-height': '8rem' }}
                            />
                        </>
                    ) : (
                        <>
                            {hasContacts ? (
                                <>
                                    <h2 className="text-xl text-bold mt-4 mb-3">{c('Title')
                                        .t`Forwarding addresses`}</h2>
                                    {contacts?.map((c) => <ContactCard {...getContactProps(c)} key={c.ID} />)}
                                    {blockedContacts && (
                                        <p className="color-weak mt-2 mb-5">{c('Title').t`Blocked addresses`}</p>
                                    )}
                                    {blockedContacts?.map((c) => <ContactCard {...getContactProps(c)} key={c.ID} />)}
                                </>
                            ) : (
                                <div className="flex flex-column items-center mt-8">
                                    <img src={stamp} alt="stamp icon" />
                                    <h2 className="text-xl text-bold">{c('Title').t`Alias contacts`}</h2>
                                    <div className="text-lg text-center mt-1 mb-5">{c('Info')
                                        .t`To keep your personal email address hidden, you can create an alias contact that masks your address.`}</div>
                                    <Button
                                        color="norm"
                                        shape="outline"
                                        pill
                                        onClick={() => openMoreInfoFlowSidebar(true)}
                                        style={{ width: 'fit-content' }}
                                    >
                                        {c('Action').t`Learn more`}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Panel>
            </SidebarModal>
            <SidebarCreateContact
                {...createContact}
                itemId={itemId}
                shareId={shareId}
                onContactCreated={handleContactCreated}
            />
            <SidebarMoreInfoFlow {...moreInfoFlow} />
        </>
    );
};
