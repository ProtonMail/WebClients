import React, { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import {
    Icon,
    IconName,
    Info,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useSettingsLink,
} from '@proton/components/components';
import { BRAND_NAME, CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import headerImage from '@proton/styles/assets/img/illustrations/schedule-send-upsell-header.svg';

interface UpsellBoxProps {
    title: string;
    children?: ReactNode;
    items: Item[];
    description: ReactNode;
}

interface Item {
    icon: IconName;
    getText: () => string;
    getTooltip?: () => string;
}

const upsellItems: Item[] = [
    {
        icon: 'clock-paper-plane',
        getText: () => c('new_plans: feature').t`Schedule messages at any time`,
    },
    {
        icon: 'folders',
        getText: () => c('new_plans: feature').t`Unlimited folders, labels and filters`,
    },
    {
        icon: 'magnifier',
        getText: () => c('new_plans: feature').t`Search message content`,
    },
    {
        icon: 'storage',
        getText: () => c('new_plans: feature').t`Up to 500 GB of storage`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Storage space is shared accross ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME} and ${DRIVE_APP_NAME}`,
    },
    {
        icon: 'envelopes',
        getText: () => c('new_plans: feature').t`Up to 15 email addresses`,
    },
    {
        icon: 'globe',
        getText: () => c('new_plans: feature').t`Custom email domains`,
    },
    {
        icon: 'eye-slash',
        getText: () => c('new_plans: feature').t`Hide My Email aliases`,
        getTooltip: () => c('new_plans: feature info').t`Get unlimited aliases with SimpleLogin by ${BRAND_NAME}`,
    },
];

const UpsellBox = ({ title, items, children, description }: UpsellBoxProps) => (
    <div>
        <div className="text-center">
            <div className="mb1 rounded">
                <img
                    src={headerImage}
                    className="w100 block"
                    alt={c('Description').t`ProtonMail logo and a plus sign`}
                />
            </div>
            <h1 className="h3 text-bold mb1">{title}</h1>
            <div className="color-weak mb1 px1">{description}</div>
        </div>

        <div className="border border-primary rounded p1-5 pt1">
            <ul className="m0 unstyled mb1">
                {items.map((item) => (
                    <li className="py0-5 rounded" key={item.getText()}>
                        <div className="flex flex-nowrap flex-align-items-center">
                            <div className="mr0-75 flex-item-noshrink flex">
                                <Icon className="color-primary mauto" size={20} name={item.icon} />
                            </div>
                            <div className="flex-item-fluid">
                                {item.getText()}
                                {item.getTooltip ? <Info className="ml0-5" title={item.getTooltip()} /> : null}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            {children}
        </div>
    </div>
);

const ComposerScheduleSendUpsellModal = (props: ModalStateProps) => {
    const goToSettings = useSettingsLink();
    const handleUpgrade = () => {
        goToSettings('/upgrade?ref=upsell_mail-modal-schedule_send', undefined, true);

        props.onClose();
    };

    return (
        <ModalTwo className="schedulesend-upsell-modal" data-testid="composer:schedule-send:upsell-modal" {...props}>
            <ModalTwoHeader />
            <ModalTwoContent>
                <UpsellBox
                    title={c('Title').t`Set your own schedule`}
                    description={c('Description')
                        .t`Unlock custom message scheduling and other benefits when you upgrade your plan.`}
                    items={upsellItems}
                >
                    <Button onClick={handleUpgrade} size="large" color="norm" shape="solid" fullWidth>{c(
                        'new_plans: Action'
                    ).t`Upgrade now`}</Button>
                </UpsellBox>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default ComposerScheduleSendUpsellModal;
