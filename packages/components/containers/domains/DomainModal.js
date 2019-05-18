import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { FormModal, useApi, useStep, Breadcrumb, useNotifications } from 'react-components';
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

const DomainModal = ({ onClose, domain, ...rest }) => {
    const [domainModel, setDomain] = useState(domain);
    const { createNotification } = useNotifications();
    const [domainName, updateDomainName] = useState(domainModel.DomainName);
    const api = useApi();
    const { step, next, goTo } = useStep();
    const handleClick = (index) => goTo(index);

    const STEPS = [
        {
            label: c('Label in domain modal').t`Domain`,
            section: <DomainSection domain={domainModel} onChange={updateDomainName} />
        }
    ];

    if (domain.ID) {
        STEPS.push({ label: c('Label in domain modal').t`Verify`, section: <VerifySection domain={domainModel} /> });
    }

    if (domainModel.VerifyState === VERIFY_STATE_GOOD) {
        STEPS.push(
            ...[
                { label: c('Label in domain modal').t`Addresses`, section: <AddressesSection domain={domainModel} /> },
                { label: 'MX', section: <MXSection /> },
                { label: 'SPF', section: <SPFSection /> },
                { label: 'DKIM', section: <DKIMSection domain={domainModel} /> },
                { label: 'DMARC', section: <DMARCSection /> }
            ]
        );
    }

    const verifyDomain = async () => {
        const data = await api(getDomain(domainModel.ID));
        const { VerifyState } = data.Domain || {};

        if (VerifyState === VERIFY_STATE_DEFAULT) {
            throw new Error(c('Error').t`Verification did not succeed, please try again in an hour.`);
        }

        if (VerifyState === VERIFY_STATE_EXIST) {
            throw new Error(
                c('Error')
                    .t`Wrong verification code. Please make sure you copied the verification code correctly and try again. It can take up to 24 hours for changes to take effect.`
            );
        }

        return data.Domain;
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
            const { Domain } = await verifyDomain();
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
            onSubmit={handleSubmit}
            close={c('Action').t`Close`}
            submit={step < STEPS.length - 1 ? c('Action').t`Next` : c('Action').t`Finish`}
            title={domainModel.ID ? c('Title').t`Edit domain` : c('Title').t`Add domain`}
            {...rest}
        >
            {<Breadcrumb list={STEPS.map(({ label }) => label)} current={step} onClick={handleClick} />}
            {STEPS[step].section}
        </FormModal>
    );
};

DomainModal.propTypes = {
    onClose: PropTypes.func,
    domain: PropTypes.object.isRequired
};

DomainModal.defaultProps = {
    domain: {}
};

export default DomainModal;
