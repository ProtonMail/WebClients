import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import type { ModalProps } from '@proton/components/components';
import {
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
} from '@proton/components/components';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { aliasSyncEnable } from '@proton/pass/store/actions';
import { selectDefaultVault, selectWritableVaults } from '@proton/pass/store/selectors';
import { truthy } from '@proton/pass/utils/fp/predicates';

type AliasSyncFormValues = { shareId: string };
type Props = Pick<ModalProps, 'onClose'> & { aliasCount: number };

const FORM_ID = 'alias-sync-vault-picker';

export const AliasSyncModal: FC<Props> = ({ aliasCount, onClose }) => {
    const writableVaults = useSelector(selectWritableVaults);
    const defaultVault = useSelector(selectDefaultVault);
    const { loading, dispatch } = useRequest(aliasSyncEnable, {});

    const form = useFormik<AliasSyncFormValues>({
        onSubmit: ({ shareId }) => {
            dispatch(shareId);
            onClose?.();
        },
        initialValues: { shareId: defaultVault.shareId },
    });

    return (
        <ModalTwo open onClose={onClose} size="medium" className="mt-10">
            <ModalTwoHeader title={c('Title').t`Sync alias`} />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Card className="mb-3" rounded>
                            <div className="flex justify-space-between items-center">
                                <div className="w-custom" style={{ '--w-custom': '6.25rem' }}>
                                    <strong className="text-sm block text-ellipsis">{c('Label').t`Import`}</strong>
                                    <span className="text-sm text-weak">
                                        {c('Label').ngettext(
                                            msgid`${aliasCount} alias`,
                                            `${aliasCount} aliases`,
                                            aliasCount
                                        )}
                                    </span>
                                </div>
                                <Icon name="arrow-right" />
                                <div className="w-custom" style={{ '--w-custom': '9.375rem' }}>
                                    <SelectTwo
                                        value={form.values.shareId}
                                        className="text-sm"
                                        onValue={(value) => form.setFieldValue('shareId', value)}
                                    >
                                        {writableVaults
                                            .map((vault) => (
                                                <Option
                                                    key={vault.shareId}
                                                    title={vault.content.name}
                                                    value={vault.shareId}
                                                    className="text-sm"
                                                >
                                                    <span className="flex items-center">
                                                        <Icon
                                                            name={
                                                                vault.content.display.icon
                                                                    ? VAULT_ICON_MAP[vault.content.display.icon]
                                                                    : 'pass-home'
                                                            }
                                                            size={3.5}
                                                            className="mr-3 grow-0"
                                                        />
                                                        <span className="flex-1 text-ellipsis">
                                                            {vault.content.name}
                                                        </span>
                                                    </span>
                                                </Option>
                                            ))
                                            .filter(truthy)}
                                    </SelectTwo>
                                </div>
                            </div>
                        </Card>
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="reset" onClick={onClose} color="weak">
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" loading={loading} color="norm" form={FORM_ID}>{c('Action').t`Confirm`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
