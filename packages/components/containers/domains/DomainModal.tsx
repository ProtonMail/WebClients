import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { addDomain, getDomain } from '@proton/shared/lib/api/domains';
import type { Domain, DomainAddress } from '@proton/shared/lib/interfaces';
import {
    DKIM_STATE,
    DMARC_STATE,
    DOMAIN_STATE,
    MX_STATE,
    SPF_STATE,
    VERIFY_STATE,
} from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import {
    ButtonGroup,
    Form,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    RoundedIcon,
    Tooltip,
    useFormErrors,
} from '../../components';
import { useApi, useCustomDomains, useEventManager, useNotifications, useStep } from '../../hooks';
import AddressesSection from './AddressesSection';
import DKIMSection from './DKIMSection';
import DMARCSection from './DMARCSection';
import DomainSection from './DomainSection';
import MXSection from './MXSection';
import SPFSection from './SPFSection';
import VerifySection from './VerifySection';

const STEPS = {
    DOMAIN: 0,
    VERIFY: 1,
    ADDRESSES: 2,
    MX: 3,
    SPF: 4,
    DKIM: 5,
    DMARC: 6,
};

export const verifyDomain = (domain?: Domain) => {
    if (domain?.VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT) {
        return c('Error').t`Verification did not succeed, please try again in an hour.`;
    }

    if (domain?.VerifyState === VERIFY_STATE.VERIFY_STATE_EXIST) {
        return c('Error')
            .t`Wrong verification code. Please make sure you copied the verification code correctly and try again. It can take up to 24 hours for changes to take effect.`;
    }
};

interface Props extends ModalProps {
    domain?: Domain;
    domainAddresses?: DomainAddress[];
}

const DomainModal = ({ domain, domainAddresses = [], ...rest }: Props) => {
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [domainModel, setDomain] = useState<Partial<Domain>>(() => ({ ...domain }));

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [domainName, updateDomainName] = useState(domainModel.DomainName || '');
    const api = useApi();
    const { step, next, goTo } = useStep();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();

    const handleClose = async () => {
        void call(); // Refresh domains model present in background page
        rest.onClose?.();
    };

    const renderDKIMIcon = () => {
        const { DKIM_STATE_ERROR, DKIM_STATE_GOOD, DKIM_STATE_WARNING } = DKIM_STATE;

        switch (domainModel.DKIM?.State) {
            case DKIM_STATE_ERROR: {
                return (
                    <Tooltip
                        title={c('Tooltip')
                            .t`We stopped DKIM signing due to problems with your DNS configuration. Please follow the instructions below to resume signing.`}
                    >
                        <RoundedIcon className="mr-1 md:mr-2 p-1 md:p-0" key="dkim-icon" type="error" name="cross" />
                    </Tooltip>
                );
            }

            case DKIM_STATE_GOOD: {
                return (
                    <Tooltip title={c('Tooltip').t`Your DKIM signing is working.`}>
                        <RoundedIcon
                            className="mr-1 md:mr-2 p-1 md:p-0"
                            key="dkim-icon"
                            type="success"
                            name="checkmark"
                        />
                    </Tooltip>
                );
            }

            case DKIM_STATE_WARNING: {
                return (
                    <Tooltip
                        title={c('Tooltip')
                            .t`We detected a problem with your DNS configuration. Please make sure your records match the instructions below. If the problem persists, we will have to switch DKIM signing off.`}
                    >
                        <Icon size={6} className="mr-1 md:mr-2 p-1 md:p-0" name="exclamation-circle-filled" />
                    </Tooltip>
                );
            }

            default: {
                return null;
            }
        }
    };

    const breadcrumbLabels = [
        c('Label in domain modal').t`Domain`,
        c('Label in domain modal').t`Verify`,
        c('Label in domain modal').t`Addresses`,
        'MX',
        'SPF',
        'DKIM',
        'DMARC',
    ];

    const breadcrumbIcons = [
        domainModel.State === DOMAIN_STATE.DOMAIN_STATE_DEFAULT || !domainModel.State ? null : (
            <RoundedIcon
                className="mr-1 md:mr-2 p-1 md:p-0"
                key="domain-icon"
                type={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED ? 'success' : 'error'}
                name={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED ? 'checkmark' : 'cross'}
            />
        ),
        domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT || !domainModel.VerifyState ? null : (
            <RoundedIcon
                className="mr-1 md:mr-2 p-1 md:p-0"
                key="verify-icon"
                type={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'checkmark' : 'cross'}
            />
        ),
        domainAddresses.length ? (
            <RoundedIcon className="mr-1 md:mr-2 p-1 md:p-0" key="addresses-icon" type="success" name="checkmark" />
        ) : null,
        domainModel.MxState === MX_STATE.MX_STATE_DEFAULT || !domainModel.MxState ? null : (
            <RoundedIcon
                className="mr-1 md:mr-2 p-1 md:p-0"
                key="mx-icon"
                type={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'checkmark' : 'cross'}
            />
        ),
        domainModel.SpfState === SPF_STATE.SPF_STATE_DEFAULT || !domainModel.SpfState ? null : (
            <RoundedIcon
                className="mr-1 md:mr-2 p-1 md:p-0"
                key="spf-icon"
                type={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'checkmark' : 'cross'}
            />
        ),
        [DKIM_STATE.DKIM_STATE_ERROR, DKIM_STATE.DKIM_STATE_GOOD, DKIM_STATE.DKIM_STATE_WARNING].includes(
            domainModel.DKIM?.State as DKIM_STATE
        )
            ? renderDKIMIcon()
            : null,
        domainModel.DmarcState === DMARC_STATE.DMARC_STATE_DEFAULT || !domainModel.DmarcState ? null : (
            <RoundedIcon
                className="mr-1 md:mr-2 p-1 md:p-0"
                key="dmarc-icon"
                type={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'checkmark' : 'cross'}
            />
        ),
    ];

    const { section, onSubmit, submit } = (() => {
        if (step === STEPS.DOMAIN) {
            const handleSubmit = async () => {
                if (domainModel.ID) {
                    return next();
                }
                const { Domain } = await api<{ Domain: Domain }>(addDomain({ Name: domainName }));
                setDomain(Domain);
                await call();
                next();
            };

            return {
                section: (
                    <DomainSection
                        validator={validator}
                        domain={domainModel}
                        domainName={domainName}
                        onValue={updateDomainName}
                    />
                ),
                submit: undefined,
                onSubmit: (event: FormEvent<HTMLFormElement>) => {
                    if (!onFormSubmit(event.currentTarget)) {
                        return;
                    }
                    void withLoading(handleSubmit().catch(noop));
                },
            };
        }

        if (step === STEPS.VERIFY) {
            const handleSubmit = async () => {
                if (domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                    return next();
                }
                if (!domainModel.ID) {
                    throw new Error('Missing domain id');
                }

                const { Domain } = await api<{ Domain: Domain }>(getDomain(domainModel.ID));

                const error = verifyDomain(Domain);
                if (error) {
                    return createNotification({ text: error, type: 'error' });
                }

                setDomain(Domain);
                await call();
                createNotification({ text: c('Success').t`Domain verified` });
                next();
            };

            return {
                section: <VerifySection domain={domainModel} />,
                submit: undefined,
                onSubmit: () => withLoading(handleSubmit()),
            };
        }

        if (step === STEPS.ADDRESSES) {
            return {
                section: <AddressesSection onClose={handleClose} />,
                submit: undefined,
                onSubmit: next,
            };
        }

        if (step === STEPS.MX) {
            return {
                section: <MXSection />,
                submit: undefined,
                onSubmit: next,
            };
        }

        if (step === STEPS.SPF) {
            return {
                section: <SPFSection />,
                submit: undefined,
                onSubmit: next,
            };
        }

        if (step === STEPS.DKIM) {
            return {
                section: <DKIMSection domain={domainModel} />,
                submit: undefined,
                onSubmit: next,
            };
        }

        if (step === STEPS.DMARC) {
            return {
                section: <DMARCSection />,
                submit: c('Action').t`Done`,
                onSubmit: rest.onClose,
            };
        }

        throw new Error('Missing step');
    })();

    useEffect(() => {
        if (!loadingCustomDomains) {
            const maybeDomain = customDomains?.find(({ ID }) => ID === domainModel.ID);
            if (maybeDomain) {
                setDomain({ ...maybeDomain });
            }
        }
    }, [customDomains]);

    return (
        <ModalTwo className="modal--full" as={Form} onSubmit={onSubmit} {...rest}>
            <ModalTwoHeader title={domainModel.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`} />
            <ModalTwoContent>
                <ButtonGroup className="mb-4">
                    {breadcrumbLabels.map((label, index) => (
                        <Button
                            icon
                            key={label}
                            className={clsx(['flex flex-nowrap items-center', index === step && 'is-selected'])}
                            disabled={
                                (index > STEPS.DOMAIN && !domainModel.ID) ||
                                (index > STEPS.VERIFY && domainModel.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD)
                            }
                            onClick={() => goTo(index)}
                            title={label}
                        >
                            {breadcrumbIcons[index]}
                            <span className="text-ellipsis max-w-full">{label}</span>
                        </Button>
                    ))}
                </ButtonGroup>
                {section}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" type="submit" loading={loading}>
                    {submit || c('Action').t`Next`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DomainModal;
