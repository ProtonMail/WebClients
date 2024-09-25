import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { useActiveBreakpoint } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { type OnlineService } from '../constants';

import './AccountsLoginModalServiceItem.scss';

interface ServiceDetailsProps {
    service: OnlineService;
    isServiceDone?: boolean;
    serviceMarkedAsDone?: boolean;
    onServiceDone: (serviceKey: string, hideItem: boolean) => void;
}

const ServiceItemAction = ({ service, onServiceDone, serviceMarkedAsDone }: ServiceDetailsProps) => {
    return (
        <div className="flex items-center gap-2 account-login--actions">
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
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <div
            className={clsx(
                'h-custom border-bottom flex gap-2 account-login--item',
                viewportWidth['<=small'] && 'pb-2',
                isServiceDone && 'invisible',
                serviceMarkedAsDone && 'color-weak'
            )}
            data-testid="accounts-login-modal-service-item"
            style={{ '--h-custom': viewportWidth['<=small'] ? 'auto' : '3rem' }}
        >
            <div className="flex items-center grow-2 gap-2">
                <div
                    className={clsx(
                        'flex justify-center w-custom h-custom',
                        viewportWidth['<=small'] && 'self-start',
                        !viewportWidth['<=small'] && 'items-center'
                    )}
                    style={{
                        '--w-custom': viewportWidth['<=small'] ? '2.25rem' : '3rem',
                        '--h-custom': viewportWidth['<=small'] ? '2.25rem' : '3rem',
                    }}
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
                                '--w-custom': viewportWidth['<=small'] ? '1.5rem' : '2rem',
                                '--h-custom': viewportWidth['<=small'] ? '1.5rem' : '2rem',
                            }}
                        />
                    </div>
                </div>
                <div
                    className={clsx(
                        viewportWidth['<=small'] && 'flex flex-column gap-2',
                        serviceMarkedAsDone && 'opacity-50'
                    )}
                >
                    {service.name}
                    {viewportWidth['<=small'] && <ServiceItemAction service={service} onServiceDone={onServiceDone} />}
                </div>
            </div>
            {!viewportWidth['<=small'] && (
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
