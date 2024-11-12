import { type FC, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalStateProps } from '@proton/components';
import stamp from '@proton/pass/assets/alias/alias-contact-stamp.svg';
import { ContactCard } from '@proton/pass/components/Item/Alias/Contact/ContactCard';
import { SidebarCreateContact } from '@proton/pass/components/Item/Alias/Contact/SidebarCreateContact';
import { SidebarMoreInfoFlow } from '@proton/pass/components/Item/Alias/Contact/SidebarMoreInfoFlow';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { aliasGetContactsList } from '@proton/pass/store/actions';
import { selectItem } from '@proton/pass/store/selectors';
import type { AliasContactGetResponse, AliasContactWithStatsGetResponse, UniqueItem } from '@proton/pass/types';

type Props = UniqueItem & Pick<ModalStateProps, 'onClose'>;

export const SidebarContactsView: FC<Props> = ({ onClose, itemId, shareId }) => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openMoreInfo, setOpenMoreInfo] = useState(false);
    const aliasEmail = useSelector(selectItem<'alias'>(shareId, itemId))?.aliasEmail;

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
                                <Button color="norm" key="modal-submit-button" pill onClick={() => setOpenCreate(true)}>
                                    {c('Action').t`Create contact`}
                                </Button>,
                            ]}
                        />
                    }
                >
                    <div className="flex items-center mb-4">
                        <h2 className="text-xl text-bold mr-2">{c('Title').t`Contacts`}</h2>
                        <Button
                            icon
                            pill
                            shape="solid"
                            color="weak"
                            onClick={() => setOpenMoreInfo(true)}
                            title={c('Info').t`See more info`}
                            size="small"
                            className="button-xs"
                        >
                            <span className="text-bold">?</span>
                        </Button>
                    </div>

                    <div className="mb-6">{c('Info')
                        .t`A contact is created for every email address that sends emails to or receives emails from ${aliasEmail}.`}</div>

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
                                    <Button color="weak" shape="solid" pill onClick={() => setOpenMoreInfo(true)}>
                                        {c('Action').t`Learn more`}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Panel>
            </SidebarModal>
            {openCreate && (
                <SidebarCreateContact
                    itemId={itemId}
                    shareId={shareId}
                    onContactCreated={handleContactCreated}
                    onClose={() => setOpenCreate(false)}
                />
            )}
            {openMoreInfo && <SidebarMoreInfoFlow onClose={() => setOpenMoreInfo(false)} />}
        </>
    );
};
