import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button, Card } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon, InlineLinkButton } from '@proton/components';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import { selectTrialDaysRemaining } from '@proton/pass/store';
import clsx from '@proton/utils/clsx';

import { SidebarModal } from '../../../shared/components/sidebarmodal/SidebarModal';
import { UpgradeButton } from '../../../shared/components/upgrade/UpgradeButton';
import { PanelHeader } from '../Panel/Header';
import { Panel } from '../Panel/Panel';

export type Props = Omit<ModalProps, 'onSubmit'>;

const getFeatures = (): { className: string; icon: IconName; label: string }[] => [
    {
        className: 'ui-orange',
        icon: 'pass-circles',
        label: c('Info').t`Multiple vaults`,
    },
    {
        className: 'ui-violet',
        icon: 'lock',
        label: c('Info').t`Integrated 2FA authenticator`,
    },
    {
        className: 'ui-teal',
        icon: 'list-bullets',
        label: c('Info').t`Custom fields`,
    },
];

const TRIAL_BLOG_URL = 'https://proton.me/support/pass-trial';

export const FreeTrialModal: VFC<Props> = ({ ...props }) => {
    const features = getFeatures();
    const daysRemaining = useSelector(selectTrialDaysRemaining);

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
                            <UpgradeButton
                                key="upgrade-button"
                                label={c('Action').t`Upgrade to keep these features`}
                            />,
                        ]}
                    />
                }
            >
                <img src="/assets/onboarding.svg" className="mb-2 w66" alt="user onboarding graphic" />
                <h3 className="mb-4 text-bold">{c('Title').t`Enjoy your free trial`}</h3>
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
                        {c('Info').ngettext(
                            msgid`You have ${daysRemaining} day left in your trial period.`,
                            `You have ${daysRemaining} days left in your trial period.`,
                            daysRemaining
                        )}
                    </div>
                )}
                <InlineLinkButton className="text-sm" onClick={() => window.open(TRIAL_BLOG_URL, '_blank')}>
                    {c('Action').t`Learn more`}
                </InlineLinkButton>
            </Panel>
        </SidebarModal>
    );
};
