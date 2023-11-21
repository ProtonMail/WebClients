import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button, Card } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon, InlineLinkButton } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { SidebarModal } from '@proton/pass/components/Layout/Modal/SidebarModal';
import { Panel } from '@proton/pass/components/Layout/Panel/Panel';
import { PanelHeader } from '@proton/pass/components/Layout/Panel/PanelHeader';
import { PASS_BLOG_TRIAL_URL } from '@proton/pass/constants';
import { selectTrialDaysRemaining } from '@proton/pass/store/selectors';
import clsx from '@proton/utils/clsx';

export type Props = Omit<ModalProps, 'onSubmit'> & { type: UpsellingModalType };
export type UpsellingModalType = 'free-trial' | 'pass-plus';

interface OfferFeatures {
    className: string;
    icon: IconName;
    label: string;
}

interface UpsellModalContent {
    title: string;
    description?: string;
    upgradeLabel: string;
}

const getFeatures = (): OfferFeatures[] => [
    { className: 'ui-orange', icon: 'pass-circles', label: c('Info').t`Multiple vaults` },
    { className: 'ui-teal', icon: 'alias', label: c('Info').t`Unlimited Aliases` },
    { className: 'ui-red', icon: 'users-plus', label: c('Info').t`Share with 10 others` },
    { className: 'ui-lime', icon: 'list-bullets', label: c('Info').t`Credit cards, Custom fields` },
];

const getContent = (type: UpsellingModalType): UpsellModalContent =>
    ({
        'free-trial': {
            title: 'Your welcome gift',
            description: undefined,
            upgradeLabel: c('Action').t`Upgrade now`,
        },
        'pass-plus': {
            title: 'Pass Plus',
            description: c('Info')
                .t`Get unlimited aliases, enjoy exclusive features, and support us by subscribing to Pass Plus.`,
            upgradeLabel: c('Action').t`Upgrade`,
        },
    })[type];

export const UpsellingModal: VFC<Props> = ({ type, ...props }) => {
    const { title, description, upgradeLabel } = getContent(type);
    const daysRemaining = useSelector(selectTrialDaysRemaining);
    const features = getFeatures();

    return (
        <SidebarModal {...props}>
            <Panel
                className="text-center"
                header={
                    <PanelHeader
                        actions={[
                            <Button
                                key="close-modal-button"
                                className="flex-item-noshrink"
                                icon
                                pill
                                shape="solid"
                                onClick={props.onClose}
                            >
                                <Icon className="modal-close-icon" name="cross" alt={c('Action').t`Close`} />
                            </Button>,
                            <UpgradeButton key="upgrade-button" label={upgradeLabel} />,
                        ]}
                    />
                }
            >
                <img src="/assets/onboarding.svg" className="mb-2 w-2/3" alt="user onboarding graphic" />
                <h3 className="mb-4 text-bold ">{title}</h3>
                {description && <p className="mb-6 text-rg">{description}</p>}

                <Card
                    rounded
                    bordered={false}
                    className="mb-4 rounded-lg"
                    style={{ backgroundColor: 'var(--field-norm)', padding: '0 1rem' }}
                >
                    {features.map(({ className, icon, label }, idx) => (
                        <div
                            className={clsx(
                                'flex flex-align-items-center py-3',
                                idx < features.length - 1 && 'border-bottom',
                                className
                            )}
                            key={label}
                        >
                            <Icon className="mr-3" color="var(--interaction-norm)" name={icon} size={18} />
                            <span>{label}</span>
                        </div>
                    ))}
                </Card>
                {daysRemaining !== null && (
                    <div className="text-sm">
                        {
                            // translator: the word "these" refers to premium features listed above
                            c('Info').ngettext(
                                msgid`You have ${daysRemaining} day left to try these and other premium features.`,
                                `You have ${daysRemaining} days left to try these and other premium features.`,
                                daysRemaining
                            )
                        }
                    </div>
                )}
                {type === 'free-trial' && (
                    <InlineLinkButton className="text-sm" onClick={() => window.open(PASS_BLOG_TRIAL_URL, '_blank')}>
                        {c('Action').t`Learn more`}
                    </InlineLinkButton>
                )}
            </Panel>
        </SidebarModal>
    );
};
