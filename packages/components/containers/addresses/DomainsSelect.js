import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { queryAvailableDomains, queryPremiumDomains } from 'proton-shared/lib/api/domains';
import { useApi, useLoading, useUser, useDomains, Select } from 'react-components';

import { fakeEvent } from '../../helpers/component';

const DomainsSelect = ({ member, onChange, className }) => {
    const api = useApi();
    const [user] = useUser();
    const [domains, loadingDomains] = useDomains();
    const [loading, withLoading] = useLoading();

    const [options, setOptions] = useState([]);
    const [domain, setDomain] = useState('');

    const handleChange = (event) => {
        setDomain(event.target.value);
        onChange(event);
    };

    const formatDomains = (domains = []) =>
        domains.reduce((acc, { State, DomainName }) => {
            State && acc.push(DomainName);
            return acc;
        }, []);

    const queryDomains = async () => {
        const [premium, available] = await Promise.all([
            member.Self && user.hasPaidMail ? api(queryPremiumDomains()).then(({ Domains }) => Domains) : [],
            member.Self ? api(queryAvailableDomains()).then(({ Domains }) => Domains) : []
        ]);

        const domainNames = [].concat(premium, available, formatDomains(domains));

        setOptions(domainNames.map((text) => ({ text, value: text })));
        setDomain(domainNames[0]);

        onChange(fakeEvent(domainNames[0]));
    };

    useEffect(() => {
        withLoading(queryDomains());
    }, [domains]);

    return (
        <Select
            className={className}
            disabled={loadingDomains || loading}
            value={domain}
            options={options}
            onChange={handleChange}
        />
    );
};

DomainsSelect.propTypes = {
    member: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    user: PropTypes.object,
    domains: PropTypes.object,
    fetchDomains: PropTypes.func,
    className: PropTypes.string
};

export default DomainsSelect;
