import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { useActiveBreakpoint } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import type { ServiceDetails } from './OnlineAccounts';

import './AccountsLoginModalServiceItem.scss';

interface ServiceDetailsProps {
    service: ServiceDetails;
    isServiceDone?: boolean;
    serviceMarkedAsDone?: boolean;
    onServiceDone: (serviceKey: string, hideItem: boolean) => void;
}

const ServiceItemAction = ({ service, onServiceDone, serviceMarkedAsDone }: ServiceDetailsProps) => {
    return (
        <div className="flex flex-align-items-center gap-2 account-login--actions">
            <ButtonLike
                as="a"
                target="_blank"
                href={service.url}
                onClick={() => onServiceDone(service.key, false)}
                size="small"
                rel="noopener noreferrer"
            >{c('Action').t`Change email`}</ButtonLike>
            {!serviceMarkedAsDone && (
                <Button size="small" onClick={() => onServiceDone(service.key, true)}>{c('Action').t`Done`}</Button>
            )}
        </div>
    );
};

const AccountsLoginModalServiceItem = ({
    service,
    onServiceDone,
    isServiceDone,
    serviceMarkedAsDone,
}: ServiceDetailsProps) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <div
            className={clsx(
                'h-custom border-bottom flex gap-2 account-login--item',
                isNarrow && 'pb-2',
                isServiceDone && 'invisible',
                serviceMarkedAsDone && 'color-weak'
            )}
            data-testid="accounts-login-modal-service-item"
            style={{ '--h-custom': isNarrow ? 'auto' : '3rem' }}
        >
            <div className="flex flex-align-items-center flex-item-grow-2 gap-2">
                <div
                    className={clsx(
                        'flex flex-justify-center w-custom h-custom',
                        isNarrow && 'flex-align-self-start',
                        !isNarrow && 'flex-align-items-center'
                    )}
                    style={{ '--w-custom': isNarrow ? '2.25rem' : '3rem', '--h-custom': isNarrow ? '2.25rem' : '3rem' }}
                >
                    <div
                        className={clsx('p-0.5 rounded', serviceMarkedAsDone && 'opacity-50')}
                        style={{ backgroundColor: '#fff' }}
                    >
                        <img
                            alt=""
                            src={service.img}
                            className="w-custom h-custom"
                            style={{
                                '--w-custom': isNarrow ? '1.5rem' : '2rem',
                                '--h-custom': isNarrow ? '1.5rem' : '2rem',
                            }}
                        />
                    </div>
                </div>
                <div className={clsx(isNarrow && 'flex flex-column gap-2', serviceMarkedAsDone && 'opacity-50')}>
                    {service.name}
                    {isNarrow && <ServiceItemAction service={service} onServiceDone={onServiceDone} />}
                </div>
            </div>
            {!isNarrow && (
                <ServiceItemAction
                    service={service}
                    onServiceDone={onServiceDone}
                    serviceMarkedAsDone={serviceMarkedAsDone}
                />
            )}
        </div>
    );
};

export default AccountsLoginModalServiceItem;
