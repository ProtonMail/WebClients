import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { FormModal, useLoading, useApi, useStep, Breadcrumb, useNotifications } from 'react-components';
import { addDomain, getDomain } from 'proton-shared/lib/api/domains';
import { VERIFY_STATE } from 'proton-shared/lib/constants';

import DomainSection from './DomainSection';
import VerifySection from './VerifySection';
import AddressesSection from './AddressesSection';
import SPFSection from './SPFSection';
import DKIMSection from './DKIMSection';
import MXSection from './MXSection';
import DMARCSection from './DMARCSection';

const { VERIFY_STATE_DEFAULT, VERIFY_STATE_EXIST, VERIFY_STATE_GOOD } = VERIFY_STATE;
const DOMAIN_STEP = 0;
const VERIFY_STEP = 1;

const DomainModal = ({ onClose, onRedirect, domain, ...rest }) => {
    const [domainModel, setDomain] = useState(domain);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [domainName, updateDomainName] = useState(domainModel.DomainName);
    const api = useApi();
    const { step, next, goTo } = useStep();
    const handleClick = (index) => goTo(index);

    const handleRedirect = (route) => {
        onRedirect(route);
        onClose();
    };

    const STEPS = [
        {
            label: c('Label in domain modal').t`Domain`,
            section: <DomainSection domain={domainModel} onChange={updateDomainName} />
        }
    ];

    if (domainModel.ID) {
        STEPS.push({ label: c('Label in domain modal').t`Verify`, section: <VerifySection domain={domainModel} /> });
    }

    if (domainModel.VerifyState === VERIFY_STATE_GOOD) {
        STEPS.push(
            ...[
                {
                    label: c('Label in domain modal').t`Addresses`,
                    section: <AddressesSection onRedirect={handleRedirect} domain={domainModel} />
                },
                { label: 'MX', section: <MXSection /> },
                { label: 'SPF', section: <SPFSection /> },
                { label: 'DKIM', section: <DKIMSection domain={domainModel} /> },
                { label: 'DMARC', section: <DMARCSection /> }
            ]
        );
    }

    const verifyDomain = ({ VerifyState }) => {
        if (VerifyState === VERIFY_STATE_DEFAULT) {
            return c('Error').t`Verification did not succeed, please try again in an hour.`;
        }

        if (VerifyState === VERIFY_STATE_EXIST) {
            return c('Error')
                .t`Wrong verification code. Please make sure you copied the verification code correctly and try again. It can take up to 24 hours for changes to take effect.`;
        }
    };

    const handleSubmit = async () => {
        if (step === DOMAIN_STEP && !domainModel.ID) {
            const { Domain } = await api(addDomain(domainName));
            setDomain(Domain);
            return next();
        }

        if (
            step === VERIFY_STEP &&
            (domainModel.VerifyState === VERIFY_STATE_DEFAULT || domainModel.VerifyState === VERIFY_STATE_EXIST)
        ) {
            const { Domain = {} } = await api(getDomain(domainModel.ID));
            const error = verifyDomain(domain);
            if (error) {
                return createNotification({ text: error, type: 'error' });
            }
            setDomain(Domain);
            createNotification({ text: c('Success').t`Domain verified` });
            return next();
        }

        if (step < STEPS.length - 1) {
            return next();
        }

        onClose();
    };

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => withLoading(handleSubmit())}
            close={c('Action').t`Close`}
            submit={c('Action').t`Next`}
            title={domainModel.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`}
            loading={loading}
            {...rest}
        >
            {<Breadcrumb list={STEPS.map(({ label }) => label)} current={step} onClick={handleClick} />}
            {STEPS[step].section}
        </FormModal>
    );
};

DomainModal.propTypes = {
    onClose: PropTypes.func,
    onRedirect: PropTypes.func.isRequired,
    domain: PropTypes.object.isRequired
};

DomainModal.defaultProps = {
    domain: {}
};

export default DomainModal;
