import { type FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import stamp from '@proton/pass/assets/alias/alias-contact-stamp.svg';
import { AliasContactCard } from '@proton/pass/components/Item/Alias/Contact/AliasContactCard';
import { AliasContactCreate } from '@proton/pass/components/Item/Alias/Contact/AliasContactCreate';
import { useAliasContacts } from '@proton/pass/components/Item/Alias/Contact/AliasContactsContext';
import { AliasContactsMoreInfo } from '@proton/pass/components/Item/Alias/Contact/AliasContactsMoreInfo';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { PassPlusIcon } from '@proton/pass/components/Upsell/PassPlusIcon';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { useItem } from '@proton/pass/hooks/useItem';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type Props = Pick<ModalStateProps, 'onClose'>;

export const AliasContactsView: FC<Props> = ({ onClose }) => {
    const { contacts, sync, loading, shareId, itemId } = useAliasContacts();
    const upsell = useUpselling();

    const [openCreate, setOpenCreate] = useState(false);
    const [openMoreInfo, setOpenMoreInfo] = useState(false);
    const aliasEmail = useItem<'alias'>(shareId, itemId)?.aliasEmail;
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;

    const empty = !loading && contacts.active.length + contacts.blocked.length === 0;

    const handleCreateClick = () => {
        if (isFreePlan) upsell({ type: 'pass-plus', upsellRef: UpsellRef.LIMIT_ALIAS });
        else setOpenCreate(true);
    };

    useEffect(sync, []);

    return (
        <>
            <SidebarModal className="ui-teal" onClose={onClose} open>
                <Panel
                    loading={loading}
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
                                <Button color="norm" key="modal-submit-button" pill onClick={handleCreateClick}>
                                    {c('Action').t`Create contact`}
                                    {isFreePlan && <PassPlusIcon className="ml-2" />}
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

                    <div className="mb-6 text-break">{c('Info')
                        .t`A contact is created for every email address that sends emails to or receives emails from ${aliasEmail}.`}</div>

                    <>
                        {contacts.active.map((contact) => (
                            <AliasContactCard contact={contact} key={contact.ID} />
                        ))}

                        {contacts.blocked.length > 0 && (
                            <>
                                <p className="color-weak mt-2 mb-5">{c('Title').t`Blocked addresses`}</p>
                                {contacts.blocked.map((contact) => (
                                    <AliasContactCard contact={contact} key={contact.ID} />
                                ))}
                            </>
                        )}

                        {empty && (
                            <div
                                className="flex flex-column items-center mt-16 max-w-custom mx-auto anime-fade-in"
                                style={{ '--max-w-custom': '30em' }}
                            >
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
                </Panel>
            </SidebarModal>
            {openCreate && <AliasContactCreate onClose={() => setOpenCreate(false)} />}
            {openMoreInfo && <AliasContactsMoreInfo onClose={() => setOpenMoreInfo(false)} />}
        </>
    );
};
