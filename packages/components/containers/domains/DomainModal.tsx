import { useState, useEffect } from 'react';
import { c } from 'ttag';
import { addDomain, getDomain } from '@proton/shared/lib/api/domains';
import { Address, Domain } from '@proton/shared/lib/interfaces';
import { VERIFY_STATE, DOMAIN_STATE, SPF_STATE, MX_STATE, DMARC_STATE, DKIM_STATE } from '@proton/shared/lib/constants';
import {
    ButtonGroup,
    RoundedIcon,
    Tooltip,
    Icon,
    Button,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    Form,
    ModalProps,
} from '../../components';
import { useLoading, useApi, useStep, useNotifications, useDomains, useEventManager } from '../../hooks';
import { classnames } from '../../helpers';

import DomainSection from './DomainSection';
import VerifySection from './VerifySection';
import AddressesSection from './AddressesSection';
import SPFSection from './SPFSection';
import DKIMSection from './DKIMSection';
import MXSection from './MXSection';
import DMARCSection from './DMARCSection';

const STEPS = {
    DOMAIN: 0,
    VERIFY: 1,
    MX: 2,
    SPF: 3,
    DKIM: 4,
    DMARC: 5,
    ADDRESSES: 6,
};

const verifyDomain = (domain?: Domain) => {
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
    domainAddresses?: Address[];
}

const DomainModal = ({ domain, domainAddresses = [], ...rest }: Props) => {
    const [domains, loadingDomains] = useDomains();
    const [domainModel, setDomain] = useState<Partial<Domain>>(() => ({ ...domain }));

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [domainName, updateDomainName] = useState(domainModel.DomainName);
    const api = useApi();
    const { step, next, goTo } = useStep();
    const { call } = useEventManager();

    const handleClose = async () => {
        void call(); // Refresh domains model present in background page
        rest.onClose?.();
    };

    const renderDKIMIcon = () => {
        const { DKIM_STATE_ERROR, DKIM_STATE_GOOD, DKIM_STATE_WARNING } = DKIM_STATE;

        let title;
        let type: 'error' | 'success' | 'warning' | undefined;
        let name;
        let icon;

        switch (domainModel.DKIM?.State) {
            case DKIM_STATE_ERROR:
                title = c('Tooltip')
                    .t`We stopped DKIM signing due to problems with your DNS configuration. Please follow the instructions below to resume signing.`;
                type = 'error';
                name = 'xmark';
                break;
            case DKIM_STATE_GOOD:
                title = c('Tooltip').t`Your DKIM signing is working.`;
                type = 'success';
                name = 'check';
                break;
            case DKIM_STATE_WARNING:
                title = c('Tooltip')
                    .t`We detected a problem with your DNS configuration. Please make sure your records match the instructions below. If the problem persists, we will have to switch DKIM signing off.`;
                type = 'warning';
                icon = <Icon size={24} className="mr0-5" name="triangle-exclamation-filled" />;
                break;
            default:
                break;
        }
        return (
            <Tooltip title={title}>
                {icon || <RoundedIcon className="mr0-5" key="dkim-icon" type={type} name={name || ''} />}
            </Tooltip>
        );
    };

    const breadcrumbLabels = [
        c('Label in domain modal').t`Domain`,
        c('Label in domain modal').t`Verify`,
        'MX',
        'SPF',
        'DKIM',
        'DMARC',
        c('Label in domain modal').t`Addresses`,
    ];

    const breadcrumbIcons = [
        !domainModel.State || domainModel.State === DOMAIN_STATE.DOMAIN_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="domain-icon"
                type={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_ACTIVE ? 'success' : 'error'}
                name={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_ACTIVE ? 'check' : 'xmark'}
            />
        ),
        !domainModel.VerifyState || domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="verify-icon"
                type={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'check' : 'xmark'}
            />
        ),
        !domainModel.MxState || domainModel.MxState === MX_STATE.MX_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="mx-icon"
                type={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'check' : 'xmark'}
            />
        ),
        !domainModel.SpfState || domainModel.SpfState === SPF_STATE.SPF_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="spf-icon"
                type={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'check' : 'xmark'}
            />
        ),
        [DKIM_STATE.DKIM_STATE_ERROR, DKIM_STATE.DKIM_STATE_GOOD, DKIM_STATE.DKIM_STATE_WARNING].includes(
            domainModel.DKIM?.State as DKIM_STATE
        )
            ? renderDKIMIcon()
            : null,
        !domainModel.DmarcState || domainModel.DmarcState === DMARC_STATE.DMARC_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="dmarc-icon"
                type={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'check' : 'xmark'}
            />
        ),
        domainAddresses.length ? (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="addresses-icon"
                type="success"
                name="check"
            />
        ) : null,
    ];

    const { section, onSubmit, submit } = (() => {
        if (step === STEPS.DOMAIN) {
            const handleSubmit = async () => {
                if (domainModel.ID) {
                    return next();
                }
                const { Domain } = await api<{ Domain: Domain }>(addDomain(domainName));
                setDomain(Domain);
                await call();
                next();
            };

            return {
                section: <DomainSection domain={domainModel} onChange={updateDomainName} />,
                submit: undefined,
                onSubmit: () => withLoading(handleSubmit()),
            };
        }

        if (step === STEPS.VERIFY) {
            const handleSubmit = async () => {
                if (domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                    return next();
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
                submit: undefined,
                onSubmit: next,
            };
        }

        if (step === STEPS.ADDRESSES) {
            return {
                section: <AddressesSection onClose={handleClose} />,
                submit: c('Action').t`Done`,
                onSubmit: rest.onClose,
            };
        }

        throw new Error('Missing step');
    })();

    useEffect(() => {
        if (!loadingDomains) {
            const maybeDomain = domains.find(({ ID }) => ID === domainModel.ID);
            if (maybeDomain) {
                setDomain({ ...maybeDomain });
            }
        }
    }, [domains]);

    return (
        <ModalTwo className="modal--full" as={Form} onSubmit={onSubmit} {...rest}>
            <ModalTwoHeader title={domainModel.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`} />
            <ModalTwoContent>
                <ButtonGroup className="mb1">
                    {breadcrumbLabels.map((label, index) => (
                        <Button
                            icon
                            key={label}
                            className={classnames([
                                'flex flex-nowrap flex-align-items-center on-mobile-pl0-25 on-mobile-pr0-25',
                                index === step && 'is-selected',
                            ])}
                            disabled={
                                (index > STEPS.DOMAIN && !domainModel.ID) ||
                                (index > STEPS.VERIFY && domainModel.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD)
                            }
                            onClick={() => goTo(index)}
                            title={label}
                        >
                            {breadcrumbIcons[index]}
                            <span className="text-ellipsis max-w100">{label}</span>
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
