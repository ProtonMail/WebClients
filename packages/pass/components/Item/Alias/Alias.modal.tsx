import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type FormikContextType, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalProps } from '@proton/components';
import { AliasPreview } from '@proton/pass/components/Alias/Alias.preview';
import { AliasForm } from '@proton/pass/components/Item/Alias/Alias.form';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import type { SanitizedAliasOptions } from '@proton/pass/hooks/useAliasOptions';
import { selectAliasLimits } from '@proton/pass/store/selectors';
import type { AliasFormValues, MaybeNull } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type AliasModalProps<T extends AliasFormValues> = {
    form: FormikContextType<T>;
    aliasOptions: MaybeNull<SanitizedAliasOptions>;
    loading: boolean;
    handleSubmitClick: () => void;
} & ModalProps;

export const AliasModal = <T extends AliasFormValues>({
    open,
    form,
    aliasOptions,
    loading,
    handleSubmitClick,
    ...modalProps
}: AliasModalProps<T>) => {
    const [ready, setReady] = useState(false);
    const { needsUpgrade } = useSelector(selectAliasLimits);

    const [showAdvanced, setShowAdvanced] = useState(false);
    const toggleShowAdvanced = () => setShowAdvanced((state) => !state);

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
            ).catch(noop);

            setReady(true);
        }
    }, [open, aliasOptions]);

    const canSubmit = !(form.errors.aliasPrefix || form.errors.aliasSuffix || form.errors.mailboxes);

    return (
        <SidebarModal {...modalProps} open={open}>
            <Panel
                className="ui-violet"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="modal-close-button"
                                className="shrink-0"
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
                                <UpgradeButton key="upgrade-button" upsellRef={UpsellRef.LIMIT_ALIAS} />
                            ) : (
                                <Button
                                    className="text-sm"
                                    key="modal-submit-button"
                                    onClick={handleSubmitClick}
                                    color="norm"
                                    pill
                                    disabled={!(ready && canSubmit)}
                                >
                                    {c('Action').t`Confirm`}
                                </Button>
                            ),
                        ]}
                    />
                }
            >
                {needsUpgrade && (
                    <Card className="text-sm" type="primary">
                        {c('Info')
                            .t`You have reached the limit of aliases you can create. Create an unlimited number of aliases when you upgrade your subscription.`}
                    </Card>
                )}
                <FormikProvider value={form}>
                    <AliasPreview
                        className="mt-6"
                        prefix={form.values.aliasPrefix ?? '<prefix>'}
                        suffix={form.values.aliasSuffix?.value ?? '<suffix>'}
                        loading={loading}
                    />
                    <div className="flex justify-center mb-4">
                        <Button shape="ghost" onClick={toggleShowAdvanced} pill>
                            <span className="flex items-center color-weak text-sm">
                                <Icon name="cog-wheel" className="mr-1" />
                                {c('Action').t`Advanced options`}
                            </span>
                        </Button>
                    </div>
                    <AliasForm<T>
                        form={form}
                        aliasOptions={aliasOptions}
                        loading={loading}
                        showAdvanced={showAdvanced}
                    />
                </FormikProvider>
            </Panel>
        </SidebarModal>
    );
};
