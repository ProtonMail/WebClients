import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { addDomain, getDomain } from '@proton/shared/lib/api/domains';
import { VERIFY_STATE, DOMAIN_STATE, SPF_STATE, MX_STATE, DMARC_STATE, DKIM_STATE } from '@proton/shared/lib/constants';
import { FormModal, ButtonGroup, RoundedIcon, Tooltip, Icon, Button } from '../../components';
import { useLoading, useApi, useStep, useNotifications, useDomains } from '../../hooks';
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

const verifyDomain = ({ VerifyState }) => {
    if (VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT) {
        return c('Error').t`Verification did not succeed, please try again in an hour.`;
    }

    if (VerifyState === VERIFY_STATE.VERIFY_STATE_EXIST) {
        return c('Error')
            .t`Wrong verification code. Please make sure you copied the verification code correctly and try again. It can take up to 24 hours for changes to take effect.`;
    }
};

/** @type any */
const DomainModal = ({ onClose, domain = {}, domainAddresses = [], ...rest }) => {
    const [domains, loadingDomains] = useDomains();
    const [domainModel, setDomain] = useState(() => ({ ...domain }));

    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [domainName, updateDomainName] = useState(domainModel.DomainName);
    const api = useApi();
    const { step, next, goTo } = useStep();

    const renderDKIMIcon = () => {
        const {
            DKIM: { State },
        } = domainModel;
        const { DKIM_STATE_ERROR, DKIM_STATE_GOOD, DKIM_STATE_WARNING } = DKIM_STATE;

        let title;
        let type;
        let name;
        let icon;

        switch (State) {
            case DKIM_STATE_ERROR:
                title = c('Tooltip')
                    .t`We stopped DKIM signing due to problems with your DNS configuration. Please follow the instructions below to resume signing.`;
                type = 'error';
                name = 'off';
                break;
            case DKIM_STATE_GOOD:
                title = c('Tooltip').t`Your DKIM signing is working.`;
                type = 'success';
                name = 'on';
                break;
            case DKIM_STATE_WARNING:
                title = c('Tooltip')
                    .t`We detected a problem with your DNS configuration. Please make sure your records match the instructions below. If the problem persists, we will have to switch DKIM signing off.`;
                type = 'warning';
                icon = <Icon size={24} className="mr0-5" name="attention-plain" />;
                break;
            default:
                break;
        }
        return (
            <Tooltip title={title}>
                {icon || <RoundedIcon className="mr0-5" key="dkim-icon" type={type} name={name} />}
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
                name={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_ACTIVE ? 'on' : 'off'}
            />
        ),
        !domainModel.VerifyState || domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="verify-icon"
                type={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        !domainModel.MxState || domainModel.MxState === MX_STATE.MX_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="mx-icon"
                type={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        !domainModel.SpfState || domainModel.SpfState === SPF_STATE.SPF_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="spf-icon"
                type={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        [DKIM_STATE.DKIM_STATE_ERROR, DKIM_STATE.DKIM_STATE_GOOD, DKIM_STATE.DKIM_STATE_WARNING].includes(
            domainModel.DKIM?.State
        )
            ? renderDKIMIcon()
            : null,
        !domainModel.DmarcState || domainModel.DmarcState === DMARC_STATE.DMARC_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="dmarc-icon"
                type={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        domainAddresses.length ? (
            <RoundedIcon
                className="mr0-5 on-mobile-p0-25 on-mobile-mr0-25"
                key="addresses-icon"
                type="success"
                name="on"
            />
        ) : null,
    ];

    const { section, ...modalProps } = (() => {
        if (step === STEPS.DOMAIN) {
            const handleSubmit = async () => {
                if (domainModel.ID) {
                    return next();
                }
                const { Domain } = await api(addDomain(domainName));
                setDomain(Domain);
                next();
            };

            return {
                section: <DomainSection domain={domainModel} onChange={updateDomainName} />,
                onSubmit: () => withLoading(handleSubmit()),
            };
        }

        if (step === STEPS.VERIFY) {
            const handleSubmit = async () => {
                if (domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                    return next();
                }

                const { Domain = {} } = await api(getDomain(domainModel.ID));

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
                onSubmit: () => withLoading(handleSubmit()),
            };
        }

        if (step === STEPS.MX) {
            return {
                section: <MXSection />,
                onSubmit: next,
            };
        }

        if (step === STEPS.SPF) {
            return {
                section: <SPFSection />,
                onSubmit: next,
            };
        }

        if (step === STEPS.DKIM) {
            return {
                section: <DKIMSection domain={domainModel} />,
                onSubmit: next,
            };
        }

        if (step === STEPS.DMARC) {
            return {
                section: <DMARCSection />,
                onSubmit: next,
            };
        }

        if (step === STEPS.ADDRESSES) {
            return {
                section: <AddressesSection onClose={onClose} />,
                submit: c('Action').t`Done`,
                onSubmit: onClose,
            };
        }
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
        <FormModal
            onClose={onClose}
            close={c('Action').t`Close`}
            submit={c('Action').t`Next`}
            title={domainModel.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`}
            loading={loading}
            className="modal--full"
            {...rest}
            {...modalProps}
        >
            <ButtonGroup className="mb1">
                {breadcrumbLabels.map((label, index) => (
                    <Button
                        icon
                        key={index}
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
        </FormModal>
    );
};

DomainModal.propTypes = {
    onClose: PropTypes.func,
    domain: PropTypes.object,
};

export default DomainModal;
