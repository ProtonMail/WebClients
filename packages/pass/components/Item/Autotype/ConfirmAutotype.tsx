import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ConfirmationModalProps } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { AutotypeKeyboardShortcut } from '@proton/pass/components/Item/Autotype/AutotypeKeyboardShortcut';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import type { WithSpotlightRenderProps } from '@proton/pass/components/Spotlight/WithSpotlight';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type ConfirmAutotypeValues = { dontShowAgain: boolean };
type ConfirmAutotypeProps = { onConfirm: () => void; spotlightToClose: WithSpotlightRenderProps } & Pick<
    ConfirmationModalProps,
    'onClose'
>;
type ConfirmAutotypePropsCore = ConfirmAutotypeProps & { isFromKeyboardShortcut?: boolean };

const ConfirmAutotypeCore: FC<ConfirmAutotypePropsCore> = ({
    onConfirm,
    onClose,
    isFromKeyboardShortcut,
    spotlightToClose,
}) => {
    const FORM_ID = isFromKeyboardShortcut ? 'autotype-confirm-shortcut' : 'autotype-confirm-click';

    const form = useFormik<ConfirmAutotypeValues>({
        initialValues: { dontShowAgain: !isFromKeyboardShortcut },
        onSubmit: ({ dontShowAgain }) => {
            if (dontShowAgain) {
                spotlightToClose.close();
            }
            void onConfirm();
        },
    });

    return (
        <PassModal onClose={onClose} open size="medium">
            <ModalTwoHeader title={c('Title').t`Perform autotype?`} />
            <ModalTwoContent>
                {BUILD_TARGET === 'linux' && (
                    <Banner variant="info" className="mb-4">
                        {c('Info')
                            .t`This feature is currently experimental on Linux. Please ensure your system is up-to-date.`}
                    </Banner>
                )}
                <div className="mb-2">{c('Info')
                    .t`Please make sure the previously active window is where you want to autotype and your cursor was focused on the login field.`}</div>
                {BUILD_TARGET === 'darwin' && (
                    <div className="text-sm color-weak mb-4">{c('Info')
                        .t`You may need to grant accessibility permission to ${PASS_APP_NAME}.`}</div>
                )}
                {BUILD_TARGET === 'linux' && (
                    <div className="text-sm color-weak mb-4">{c('Info')
                        .t`After confirming, you will need to accept a permission prompt for ${PASS_APP_NAME}.`}</div>
                )}
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Checkbox
                            className="pass-checkbox--unset gap-0 mb-2"
                            checked={form.values.dontShowAgain}
                            onChange={({ target }) => form.setFieldValue('dontShowAgain', target.checked)}
                        >
                            {isFromKeyboardShortcut ? (
                                <span className="flex gap-1">
                                    {
                                        // translator: full sentence is "Do not show again when I press Ctrl Shift V"
                                        c('Action').t`Do not show again when I press`
                                    }
                                    <AutotypeKeyboardShortcut />
                                </span>
                            ) : (
                                c('Action').t`Do not show again`
                            )}
                        </Checkbox>
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} color="norm" shape="outline" pill>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" color="norm" form={FORM_ID} pill>
                    {c('Action').t`Confirm`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};

export const ConfirmAutotype: FC<ConfirmAutotypeProps> = (props) => <ConfirmAutotypeCore {...props} />;

export const ConfirmAutotypeShortcut: FC<ConfirmAutotypeProps> = (props) => (
    <ConfirmAutotypeCore {...props} isFromKeyboardShortcut />
);
