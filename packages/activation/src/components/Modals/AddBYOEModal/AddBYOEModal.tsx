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
            getTitle: () => c('loc_nightly: BYOE').t`Allow ${BRAND_NAME} to access to your Gmail account`,
            getText: () => c('loc_nightly: BYOE').t`We only ask permission to access data that's strictly necessary.`,
        },
        {
            icon: 'arrow-down-to-square',
            getTitle: () => c('loc_nightly: BYOE').t`Import your latest messages`,
            getText: () =>
                c('loc_nightly: BYOE').t`We’ll import your latest messages, so you can quickly get productive.`,
        },
        {
            icon: 'inbox',
            getTitle: () => c('loc_nightly: BYOE').t`Receive new emails automatically`,
            getText: () =>
                c('loc_nightly: BYOE').t`New Gmail messages will seamlessly forward to your ${MAIL_APP_NAME} inbox.`,
        },
        {
            icon: 'envelope-arrow-up-and-right',
            getTitle: () => c('loc_nightly: BYOE').t`Send emails from ${BRAND_NAME}`,
            getText: () =>
                c('loc_nightly: BYOE')
                    .t`Send and manage your Gmail messages within ${MAIL_APP_NAME} apps — and leave your Gmail inbox behind.`,
        },
    ];
};

interface Props extends ModalProps {
    showIcon?: boolean;
    buttonText?: string;
    onSubmit?: () => void;
    submitDisabled?: boolean;
    isLoading?: boolean;
}

const AddBYOEModal = ({
    showIcon,
    buttonText = c('Action').t`Next`,
    onSubmit,
    submitDisabled,
    isLoading,
    ...rest
}: Props) => {
    const { onClose } = rest;

    return (
        <ModalTwo size="small" {...rest}>
            <ModalTwoHeader
                title={c('loc_nightly: BYOE').t`Connecting your Gmail address`}
                subline={c('loc_nightly: BYOE')
                    .t`It's simple to connect your Gmail address to ${BRAND_NAME} — and significantly more private.`}
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
                    {showIcon && <img src={googleLogo} alt="" />}
                    {buttonText}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddBYOEModal;
