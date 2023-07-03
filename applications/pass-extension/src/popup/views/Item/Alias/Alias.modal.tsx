import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalProps } from '@proton/components/components';
import { selectAliasLimits } from '@proton/pass/store';
import type { MaybeNull } from '@proton/pass/types';

import { SidebarModal } from '../../../../shared/components/sidebarmodal/SidebarModal';
import { UpgradeButton } from '../../../../shared/components/upgrade/UpgradeButton';
import type { AliasFormValues } from '../../../../shared/form/types';
import { validateAliasForm } from '../../../../shared/form/validator/validate-alias';
import type { SanitizedAliasOptions } from '../../../../shared/hooks/useAliasOptions';
import { AliasPreview } from '../../../components/Alias/Alias.preview';
import { ItemCard } from '../../../components/Item/ItemCard';
import { PanelHeader } from '../../../components/Panel/Header';
import { Panel } from '../../../components/Panel/Panel';
import { AliasForm } from './Alias.form';

export type AliasModalRef = {
    open: () => void;
};

type AliasModalProps<T extends AliasFormValues> = {
    shareId: string;
    form: FormikContextType<T>;
    aliasOptions: MaybeNull<SanitizedAliasOptions>;
    loading: boolean;
    handleSubmitClick: () => void;
} & ModalProps;

export const AliasModal = <T extends AliasFormValues>({
    open,
    form,
    shareId,
    aliasOptions,
    loading,
    handleSubmitClick,
    ...modalProps
}: AliasModalProps<T>) => {
    const [ready, setReady] = useState(false);
    const { needsUpgrade } = useSelector(selectAliasLimits);

    useEffect(() => {
        if (open && aliasOptions) {
            const firstSuffix = aliasOptions.suffixes?.[0];
            const firstMailBox = aliasOptions.mailboxes?.[0];

            form.setValues(
                (values) => ({
                    ...values,
                    ...(firstSuffix && { aliasSuffix: firstSuffix }),
                    ...(firstMailBox && { mailboxes: [firstMailBox] }),
                }),
                true
            );

            setReady(true);
        }
    }, [open, aliasOptions]);

    return (
        <SidebarModal {...modalProps} open={open}>
            <Panel
                className="ui-violet"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={modalProps.onClose}
                            >
                                <Icon className="modal-close-icon" name="cross" alt={c('Action').t`Close`} />
                            </Button>,

                            /* if user has reached his alias limit prompt
                             * him to upgrade his plan*/
                            needsUpgrade ? (
                                <UpgradeButton key="upgrade-button" />
                            ) : (
                                <Button
                                    className="text-sm"
                                    key="modal-submit-button"
                                    onClick={handleSubmitClick}
                                    color="norm"
                                    pill
                                    disabled={!(ready && Object.keys(validateAliasForm(form.values)).length === 0)}
                                >
                                    {c('Action').t`Confirm`}
                                </Button>
                            ),
                        ]}
                    />
                }
            >
                {needsUpgrade && (
                    <ItemCard>
                        {c('Info')
                            .t`You have reached the limit of aliases you can create. Create an unlimited number of aliases when you upgrade your subscription.`}
                    </ItemCard>
                )}
                <FormikProvider value={form}>
                    <AliasPreview
                        className="mt-6"
                        prefix={form.values.aliasPrefix ?? '<prefix>'}
                        suffix={form.values.aliasSuffix?.value ?? '<suffix>'}
                        loading={loading}
                    />
                    <AliasForm<T> form={form} aliasOptions={aliasOptions} loading={loading} />
                </FormikProvider>
            </Panel>
        </SidebarModal>
    );
};
