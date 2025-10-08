import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { createDomain, syncDomain } from '@proton/account/domains/actions';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import Form from '@proton/components/components/form/Form';
import Icon from '@proton/components/components/icon/Icon';
import RoundedIcon from '@proton/components/components/icon/RoundedIcon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useStep from '@proton/components/hooks/useStep';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
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

const renderDKIMIcon = (dkimState: Domain['DKIM']['State']) => {
    const { DKIM_STATE_ERROR, DKIM_STATE_GOOD, DKIM_STATE_WARNING } = DKIM_STATE;

    switch (dkimState) {
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
                    <RoundedIcon className="mr-1 md:mr-2 p-1 md:p-0" key="dkim-icon" type="success" name="checkmark" />
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

const getBreadcrumbs = ({ domain, domainAddresses }: { domain?: Domain; domainAddresses: DomainAddress[] }) => {
    const domainState = domain?.State || DOMAIN_STATE.DOMAIN_STATE_DEFAULT;
    const verifyState = domain?.VerifyState || VERIFY_STATE.VERIFY_STATE_DEFAULT;
    const mxState = domain?.MxState || MX_STATE.MX_STATE_DEFAULT;
    const spfState = domain?.SpfState || SPF_STATE.SPF_STATE_DEFAULT;
    const dmarcState = domain?.DmarcState || DMARC_STATE.DMARC_STATE_DEFAULT;
    const dkimState = domain?.DKIM?.State || DKIM_STATE.DKIM_STATE_DEFAULT;

    const dkimIcon = renderDKIMIcon(dkimState);
    const verified = verifyState === VERIFY_STATE.VERIFY_STATE_GOOD;

    return [
        {
            label: c('Label in domain modal').t`Domain`,
            disabled: false,
            icon:
                domainState === DOMAIN_STATE.DOMAIN_STATE_DEFAULT ? null : (
                    <RoundedIcon
                        className="mr-1 md:mr-2 p-1 md:p-0"
                        key="domain-icon"
                        type={domainState === DOMAIN_STATE.DOMAIN_STATE_VERIFIED ? 'success' : 'error'}
                        name={domainState === DOMAIN_STATE.DOMAIN_STATE_VERIFIED ? 'checkmark' : 'cross'}
                    />
                ),
        },
        {
            label: c('Label in domain modal').t`Verify`,
            disabled: !domain,
            icon:
                verifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT ? null : (
                    <RoundedIcon
                        className="mr-1 md:mr-2 p-1 md:p-0"
                        key="verify-icon"
                        type={verifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'success' : 'error'}
                        name={verifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'checkmark' : 'cross'}
                    />
                ),
        },
        {
            label: c('Label in domain modal').t`Addresses`,
            disabled: !verified,
            icon: !domainAddresses?.length ? null : (
                <RoundedIcon className="mr-1 md:mr-2 p-1 md:p-0" key="addresses-icon" type="success" name="checkmark" />
            ),
        },
        {
            label: 'MX',
            disabled: !verified,
            icon:
                mxState === MX_STATE.MX_STATE_DEFAULT ? null : (
                    <RoundedIcon
                        className="mr-1 md:mr-2 p-1 md:p-0"
                        key="mx-icon"
                        type={mxState === MX_STATE.MX_STATE_GOOD ? 'success' : 'error'}
                        name={mxState === MX_STATE.MX_STATE_GOOD ? 'checkmark' : 'cross'}
                    />
                ),
        },
        {
            label: 'SPF',
            disabled: !verified,
            icon:
                spfState === SPF_STATE.SPF_STATE_DEFAULT ? null : (
                    <RoundedIcon
                        className="mr-1 md:mr-2 p-1 md:p-0"
                        key="spf-icon"
                        type={spfState === SPF_STATE.SPF_STATE_GOOD ? 'success' : 'error'}
                        name={spfState === SPF_STATE.SPF_STATE_GOOD ? 'checkmark' : 'cross'}
                    />
                ),
        },
        {
            label: 'DKIM',
            disabled: !verified,
            icon: dkimState === DKIM_STATE.DKIM_STATE_DEFAULT ? null : dkimIcon,
        },
        {
            label: 'DMARC',
            disabled: !verified,
            icon:
                dmarcState === DMARC_STATE.DMARC_STATE_DEFAULT ? null : (
                    <RoundedIcon
                        className="mr-1 md:mr-2 p-1 md:p-0"
                        key="dmarc-icon"
                        type={dmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'success' : 'error'}
                        name={dmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'checkmark' : 'cross'}
                    />
                ),
        },
    ];
};

interface Props extends ModalProps {
    domain?: Domain;
    domainAddresses?: DomainAddress[];
}

const DomainModal = ({ domain, domainAddresses = [], ...rest }: Props) => {
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [domainModel, setDomain] = useState<Domain | undefined>(domain);
    const dispatch = useDispatch();

    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const [loading, withLoading] = useLoading();
    const [domainName, updateDomainName] = useState(domainModel?.DomainName || '');
    const { step, next, goTo } = useStep();
    const { validator, onFormSubmit } = useFormErrors();

    const handleClose = async () => {
        rest.onClose?.();
    };

    const { section, onSubmit, submit } = (() => {
        if (step === STEPS.DOMAIN || !domainModel) {
            const handleSubmit = async () => {
                if (!domainModel?.ID) {
                    const domain = await dispatch(createDomain({ name: domainName }));
                    setDomain(domain);
                    next();
                    return;
                }
                return next();
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
                    void withLoading(handleSubmit().catch(handleError));
                },
            };
        }

        if (step === STEPS.VERIFY && domainModel) {
            const handleSubmit = async () => {
                if (domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                    return next();
                }
                if (!domainModel.ID) {
                    throw new Error('Missing domain id');
                }

                const Domain = await dispatch(syncDomain(domainModel));

                const error = verifyDomain(Domain);
                if (error) {
                    return createNotification({ text: error, type: 'error' });
                }

                setDomain(Domain);
                createNotification({ text: c('Success').t`Domain verified` });
                next();
            };

            return {
                section: <VerifySection domain={domainModel} />,
                submit: undefined,
                onSubmit: () => withLoading(handleSubmit().catch(handleError)),
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

        if (step === STEPS.DKIM && domainModel) {
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
            const maybeDomain = customDomains?.find(({ ID }) => ID === domainModel?.ID);
            if (maybeDomain) {
                setDomain(maybeDomain);
            }
        }
    }, [customDomains]);

    const breadcrumbs = getBreadcrumbs({ domain: domainModel, domainAddresses });

    return (
        <ModalTwo className="modal--full" as={Form} onSubmit={onSubmit} {...rest}>
            <ModalTwoHeader title={domainModel?.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`} />
            <ModalTwoContent>
                <ButtonGroup className="mb-4">
                    {breadcrumbs.map(({ label, disabled, icon }, index) => (
                        <Button
                            icon
                            key={label}
                            className={clsx(['flex flex-nowrap items-center', index === step && 'is-selected'])}
                            disabled={disabled}
                            onClick={() => goTo(index)}
                            title={label}
                        >
                            {disabled ? null : icon}
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
