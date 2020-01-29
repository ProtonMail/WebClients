import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    FormModal,
    Group,
    ButtonGroup,
    RoundedIcon,
    useLoading,
    useApi,
    useStep,
    useNotifications,
    useDomains,
    classnames
} from 'react-components';
import { withRouter } from 'react-router-dom';
import { addDomain, getDomain } from 'proton-shared/lib/api/domains';
import { VERIFY_STATE, DOMAIN_STATE, SPF_STATE, MX_STATE, DMARC_STATE, DKIM_STATE } from 'proton-shared/lib/constants';

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
    ADDRESSES: 2,
    MX: 3,
    SPF: 4,
    DKIM: 5,
    DMARC: 6
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

// Pull staticContext to avoid it being passed with rest
// eslint-disable-next-line no-unused-vars
const DomainModal = ({ onClose, domain = {}, domainAddresses = [], history, staticContext, ...rest }) => {
    const [domains, loadingDomains] = useDomains();
    const [domainModel, setDomain] = useState(() => ({ ...domain }));
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [domainName, updateDomainName] = useState(domainModel.DomainName);
    const api = useApi();
    const { step, next, goTo } = useStep();

    const handleRedirect = (route) => {
        onClose();
        history.push(route);
    };

    const breadcrumbLabels = [
        c('Label in domain modal').t`Domain`,
        c('Label in domain modal').t`Verify`,
        c('Label in domain modal').t`Addresses`,
        'MX',
        'SPF',
        'DKIM',
        'DMARC'
    ];

    const breadcrumbIcons = [
        domainModel.State === DOMAIN_STATE.DOMAIN_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5"
                key="domain-icon"
                type={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_ACTIVE ? 'success' : 'error'}
                name={domainModel.State === DOMAIN_STATE.DOMAIN_STATE_ACTIVE ? 'on' : 'off'}
            />
        ),
        domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5"
                key="verify-icon"
                type={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        domainAddresses.length ? <RoundedIcon className="mr0-5" key="addresses-icon" type="success" name="on" /> : null,
        domainModel.MxState === MX_STATE.MX_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5"
                key="mx-icon"
                type={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.MxState === MX_STATE.MX_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        domainModel.SpfState === SPF_STATE.SPF_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5"
                key="spf-icon"
                type={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.SpfState === SPF_STATE.SPF_STATE_GOOD ? 'on' : 'off'}
            />
        ),
        [DKIM_STATE.DKIM_STATE_CHECK, DKIM_STATE.DKIM_STATE_GOOD].includes(domainModel.DkimState) ? (
            <RoundedIcon
                className="mr0-5"
                key="dkim-icon"
                type={domainModel.DkimState === DKIM_STATE.DKIM_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.DkimState === DKIM_STATE.DKIM_STATE_GOOD ? 'on' : 'off'}
            />
        ) : null,
        domainModel.DmarcState === DMARC_STATE.DMARC_STATE_DEFAULT ? null : (
            <RoundedIcon
                className="mr0-5"
                key="dmarc-icon"
                type={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'success' : 'error'}
                name={domainModel.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ? 'on' : 'off'}
            />
        )
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
                onSubmit: () => withLoading(handleSubmit())
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
                onSubmit: () => withLoading(handleSubmit())
            };
        }

        if (step === STEPS.ADDRESSES) {
            return {
                section: <AddressesSection onRedirect={handleRedirect} domainAddresses={domainAddresses} />,
                onSubmit: next
            };
        }

        if (step === STEPS.MX) {
            return {
                section: <MXSection />,
                onSubmit: next
            };
        }

        if (step === STEPS.SPF) {
            return {
                section: <SPFSection />,
                onSubmit: next
            };
        }

        if (step === STEPS.DKIM) {
            return {
                section: <DKIMSection domain={domainModel} />,
                onSubmit: next
            };
        }

        if (step === STEPS.DMARC) {
            return {
                section: <DMARCSection />,
                submit: c('Action').t`Ok`,
                onSubmit: onClose
            };
        }
    })();

    useEffect(() => {
        if (!loadingDomains) {
            const d = domains.find(({ ID }) => ID === domainModel.ID);
            d && setDomain({ ...d });
        }
    }, [domains]);

    return (
        <FormModal
            onClose={onClose}
            close={c('Action').t`Close`}
            submit={c('Action').t`Next`}
            title={domainModel.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`}
            loading={loading}
            {...rest}
            {...modalProps}
        >
            <Group className="mb1">
                {breadcrumbLabels.map((label, index) => (
                    <ButtonGroup
                        key={index}
                        className={classnames([
                            'flex flex-nowrap flex-items-center pm-button--for-icon',
                            index === step && 'is-active'
                        ])}
                        disabled={
                            (index > STEPS.DOMAIN && !domainModel.ID) ||
                            (index > STEPS.VERIFY && domainModel.VerifyState !== VERIFY_STATE.VERIFY_STATE_GOOD)
                        }
                        onClick={() => goTo(index)}
                    >
                        {breadcrumbIcons[index]}
                        <span>{label}</span>
                    </ButtonGroup>
                ))}
            </Group>
            {section}
        </FormModal>
    );
};

DomainModal.propTypes = {
    onClose: PropTypes.func,
    domain: PropTypes.object,
    domainAddresses: PropTypes.array,
    history: PropTypes.object.isRequired,
    staticContext: PropTypes.object
};

export default withRouter(DomainModal);
