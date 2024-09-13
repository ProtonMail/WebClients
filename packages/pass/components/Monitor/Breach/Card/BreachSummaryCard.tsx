import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import shieldDanger from '@proton/pass/assets/monitor/shield-bolt-danger.svg';
import { ButtonCard, type ButtonCardProps } from '@proton/pass/components/Layout/Card/ButtonCard';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { CardContent } from '@proton/pass/components/Layout/Card/CardContent';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';

type Props = { className?: string; onClick: () => void };

type SummaryProps = Pick<ButtonCardProps, 'subtitle' | 'icon' | 'disabled' | 'onClick' | 'type'>;

export const BreachSummaryCard: FC<Props> = ({ className, onClick }) => {
    const { breaches, didLoad, sync } = useMonitor();
    const breached = breaches.count > 0;
    const loading = breaches.loading;
    const error = !loading && !didLoad;

    if (!breached) {
        const props = ((): SummaryProps => {
            if (!didLoad && loading) {
                return {
                    disabled: true,
                    icon: () => <CircleLoader size="small" className="mx-1" />,
                    subtitle: c('Title').t`Loading breaches...`,
                    type: 'primary',
                };
            }

            if (error) {
                return {
                    icon: 'exclamation-filled',
                    type: 'danger',
                    subtitle: (
                        <span>
                            {c('Warning').t`Failed to load breaches.`}{' '}
                            <InlineLinkButton onClick={sync}>{c('Action').t`Try again.`}</InlineLinkButton>
                        </span>
                    ),
                };
            }

            return {
                icon: loading ? () => <CircleLoader size="small" className="mx-1" /> : 'checkmark',
                subtitle: c('Info').t`No breaches detected`,
                type: 'success',
                onClick,
            };
        })();

        return <ButtonCard className={className} title={c('Title').t`Dark Web Monitoring`} {...props} />;
    }

    return (
        <Card type="danger" className={className}>
            <CardContent
                title={c('Title').t`Breach detected`}
                titleClassname="text-lg text-bold"
                subtitle={c('Description').t`Your personal info was leaked in a data breach of a third-party service.`}
                subtitleClassname="color-danger"
                icon={() => <img src={shieldDanger} alt="" className="shrink-0" />}
            />
            <Button type="button" color="norm" pill onClick={onClick} className="w-full mt-4">
                {c('Action').t`View details`}
            </Button>
        </Card>
    );
};
