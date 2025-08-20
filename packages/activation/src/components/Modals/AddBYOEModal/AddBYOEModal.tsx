import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

const getModalItems = (): { icon: IconName; getTitle: () => string; getText: () => string }[] => {
    return [
        {
            icon: 'brand-google',
            getTitle: () => c('loc_nightly: BYOE').t`Allow ${BRAND_NAME} to connect to your Gmail`,
            getText: () =>
                c('loc_nightly: BYOE')
                    .t`We only ask permission to access data that's strictly necessary. Nothing more.`,
        },
        {
            icon: 'arrow-down-to-square',
            getTitle: () => c('loc_nightly: BYOE').t`Pick up where you left off`,
            getText: () =>
                c('loc_nightly: BYOE')
                    .t`We’ll bring in your most recent emails, ensuring your ${MAIL_APP_NAME} inbox is up-to-date and ready for action.`,
        },
        {
            icon: 'inbox',
            getTitle: () => c('loc_nightly: BYOE').t`Receive new emails`,
            getText: () =>
                c('loc_nightly: BYOE')
                    .t`Emails sent to your Gmail address will automatically be forwarded to your ${MAIL_APP_NAME} inbox.`,
        },
        {
            icon: 'envelope-arrow-up-and-right',
            getTitle: () => c('loc_nightly: BYOE').t`Send messages from ${BRAND_NAME}`,
            getText: () =>
                c('loc_nightly: BYOE')
                    .t`Send and manage your Gmail messages within ${MAIL_APP_NAME} apps — and leave Gmail behind.`,
        },
    ];
};

interface Props extends ModalProps {
    onSubmit?: () => void;
    submitDisabled?: boolean;
    isLoading?: boolean;
}

const AddBYOEModal = ({ onSubmit, submitDisabled, isLoading, ...rest }: Props) => {
    const { onClose } = rest;

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader
                title={c('loc_nightly: BYOE').t`Connecting your Gmail address`}
                subline={c('loc_nightly: BYOE')
                    .t`Connecting your Gmail address to ${MAIL_APP_NAME} is simple — and far more private: no ads, protection from trackers and encrypted sending.`}
            />
            <ModalTwoContent>
                {getModalItems().map((item) => {
                    return (
                        <div key={item.getTitle()} className="flex flex-row flex-nowrap gap-2 items-start mb-2">
                            <div className="bg-weak rounded-full flex p-2">
                                <Icon name={item.icon} className="shrink-0" />
                            </div>
                            <div className="flex-1">
                                <p className="text-bold mt-0 mb-1">{item.getTitle()}</p>
                                <p className="my-1 color-weak">{item.getText()}</p>
                            </div>
                        </div>
                    );
                })}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="w-full" onClick={onClose} disabled={isLoading} shape="ghost">{c('Action')
                    .t`Cancel`}</Button>
                <Button
                    className="w-full inline-flex items-center justify-center gap-2"
                    onClick={onSubmit}
                    disabled={submitDisabled}
                    loading={isLoading}
                >
                    <img src={googleLogo} alt="" />
                    {c('loc_nightly: BYOE').t`Connect to Gmail`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddBYOEModal;
