import { type FC, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Info, type ModalStateProps, useModalState } from '@proton/components';
import stamp from '@proton/pass/assets/alias/alias-contact-stamp.svg';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { ContactCard } from '@proton/pass/components/Item/Alias/Contact/ContactCard';
import { SidebarCreateContact } from '@proton/pass/components/Item/Alias/Contact/SidebarCreateContact';
import { SidebarMoreInfoFlow } from '@proton/pass/components/Item/Alias/Contact/SidebarMoreInfoFlow';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { validateAliasContactSenderName } from '@proton/pass/lib/validation/alias';
import { aliasGetContactsList } from '@proton/pass/store/actions';
import { selectAliasDetails } from '@proton/pass/store/selectors';
import type { AliasContactValues, AliasContactWithStatsGetResponse, UniqueItem } from '@proton/pass/types';

const FORM_ID = 'add-contact-form';

type Props = UniqueItem & Pick<ModalStateProps, 'onClose'> & { aliasEmail: string };

export const SidebarContactsView: FC<Props> = ({ aliasEmail, onClose, itemId, shareId }) => {
    const [createContact, openCreateContactSidebar] = useModalState();
    const [moreInfoFlow, openMoreInfoFlowSidebar] = useModalState();
    const { data, loading, dispatch } = useRequest(aliasGetContactsList, { initial: { shareId, itemId } });
    const aliasDetails = useSelector(selectAliasDetails(aliasEmail));
    const hasContacts = (data?.Total ?? 0) > 0;
    const { contacts, blockedContacts } = useMemo(
        () => Object.groupBy(data?.Contacts ?? [], (contact) => (contact.Blocked ? 'blockedContacts' : 'contacts')),
        [data]
    );

    const form = useFormik<AliasContactValues>({
        initialValues: { name: aliasDetails?.name ?? '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateAliasContactSenderName,
        onSubmit: () => openCreateContactSidebar(true),
    });

    const getContactProps = (contact: AliasContactWithStatsGetResponse) => ({
        shareId,
        itemId,
        ...contact,
    });

    useEffect(() => dispatch({ shareId, itemId }), []);

    return (
        <>
            <SidebarModal className="ui-teal" onClose={onClose} open>
                {(didEnter) => (
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
                                    <Button color="norm" key="modal-submit-button" pill type="submit" form={FORM_ID}>
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
                        <FormikProvider value={form}>
                            <Form id={FORM_ID}>
                                <FieldsetCluster>
                                    <Field
                                        name="name"
                                        label={c('Label').t`Sender name`}
                                        placeholder={c('Placeholder').t`Enter the sender name`}
                                        autoFocus={didEnter}
                                        component={TextField}
                                        maxLength={MAX_ITEM_NAME_LENGTH}
                                        actionsContainerClassName="flex self-center"
                                        actions={[<Icon name="pencil" size={4} />]}
                                    />
                                </FieldsetCluster>
                            </Form>
                        </FormikProvider>

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
                                        {blockedContacts?.map((c) => (
                                            <ContactCard {...getContactProps(c)} key={c.ID} />
                                        ))}
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
                )}
            </SidebarModal>
            <SidebarCreateContact {...createContact} itemId={itemId} shareId={shareId} name={form.values.name} />
            <SidebarMoreInfoFlow {...moreInfoFlow} />
        </>
    );
};
