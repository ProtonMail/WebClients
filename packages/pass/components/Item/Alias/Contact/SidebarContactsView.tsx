import { type FC, useEffect, useRef } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Info, type ModalStateProps, useModalState } from '@proton/components';
import stamp from '@proton/pass/assets/alias/alias-contact-stamp.svg';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { SidebarCreateContact } from '@proton/pass/components/Item/Alias/Contact/SidebarCreateContact';
import { SidebarMoreInfoFlow } from '@proton/pass/components/Item/Alias/Contact/SidebarMoreInfoFlow';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { validateAliasContactSenderName } from '@proton/pass/lib/validation/alias';
import { aliasGetContactsList } from '@proton/pass/store/actions';
import type { AliasState } from '@proton/pass/store/reducers';
import type { AliasContactValues, UniqueItem } from '@proton/pass/types';

const FORM_ID = 'add-contact-form';

type Props = UniqueItem &
    Pick<ModalStateProps, 'onClose'> & {
        aliasDetails: AliasState['aliasDetails'][string];
    };

export const SidebarContactsView: FC<Props> = ({ aliasDetails, onClose, itemId, shareId }) => {
    const [createContact, openCreateContactSidebar] = useModalState();
    const [moreInfoFlow, openMoreInfoFlowSidebar] = useModalState();
    const { data, dispatch } = useRequest(aliasGetContactsList, {});
    const hasContacts = (data?.Total ?? 0) > 0;
    const name = useRef(aliasDetails?.name ?? '');

    const form = useFormik<AliasContactValues>({
        initialValues: { name: name.current },
        validateOnChange: true,
        validateOnMount: false,
        validate: validateAliasContactSenderName,
        onSubmit: () => openCreateContactSidebar(true),
    });

    const emailSender = (
        <b key="display-name">{`<${!name.current && form.values.name + ' '}${aliasDetails?.displayName}>`}</b>
    );

    useEffect(() => {
        dispatch({ shareId, itemId });
    }, []);

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
                        {aliasDetails?.displayName && (
                            <span className="color-weak  mt-2">{c('Info')
                                .jt`When sending an email from this alias, the email will have ${emailSender} as sender.`}</span>
                        )}
                        {hasContacts ? (
                            <>
                                <h2 className="text-lg text-bold mt-4">{c('Title').t`Forwarding addresses`}</h2>
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
                    </Panel>
                )}
            </SidebarModal>
            <SidebarCreateContact {...createContact} itemId={itemId} shareId={shareId} name={form.values.name} />
            <SidebarMoreInfoFlow {...moreInfoFlow} />
        </>
    );
};
