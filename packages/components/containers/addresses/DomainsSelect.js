import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { queryAvailableDomains, queryPremiumDomains } from 'proton-shared/lib/api/domains';
import { useUser, useDomains, Select, useApiWithoutResult } from 'react-components';

import { fakeEvent } from '../../helpers/component';

const DomainsSelect = ({ member, onChange, className }) => {
    const [user] = useUser();
    const [domains] = useDomains();

    const { request: requestAvailableDomains, loading } = useApiWithoutResult(queryAvailableDomains);
    const { request: requestPremiumDomains } = useApiWithoutResult(queryPremiumDomains);
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
            member.Self && user.hasPaidMail ? requestPremiumDomains().then(({ Domains }) => Domains) : [],
            member.Self ? requestAvailableDomains().then(({ Domains }) => Domains) : [],
            user.hasPaidMail ? domains : []
        ]);

        const domainNames = [].concat(premium, available, formatDomains(domains));

        setOptions(domainNames.map((text) => ({ text, value: text })));
        setDomain(domainNames[0]);
        onChange(fakeEvent(domainNames[0]));
    };

    useEffect(() => {
        queryDomains();
    }, []);

    return <Select className={className} disabled={loading} value={domain} options={options} onChange={handleChange} />;
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
