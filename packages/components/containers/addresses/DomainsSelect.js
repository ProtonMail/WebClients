import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchDomains } from 'proton-shared/lib/state/domains/actions';
import { queryAvailableDomains, queryPremiumDomains } from 'proton-shared/lib/api/domains';
import { MEMBER_TYPE } from 'proton-shared/lib/constants';
import { Select, useApiWithoutResult } from 'react-components';

import { fakeEvent } from '../../helpers/component';

const DomainsSelect = ({ member, onChange, user, domains, fetchDomains }) => {
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
        const [available, premium] = await Promise.all([
            member.Type === MEMBER_TYPE.MEMBER ? requestAvailableDomains().then(({ Domains }) => Domains) : [],
            member.Type === MEMBER_TYPE.MEMBER && user.isPaidMail
                ? requestPremiumDomains().then(({ Domains }) => Domains)
                : [],
            user.isPaidMail ? fetchDomains() : []
        ]);

        const domainNames = [].concat(available, premium, formatDomains(domains.data));

        setOptions(domainNames.map((text) => ({ text, value: text })));
        setDomain(domainNames[0]);
        onChange(fakeEvent(domainNames[0]));
    };

    useEffect(() => {
        queryDomains();
    }, []);

    return <Select disabled={loading} value={domain} options={options} onChange={handleChange} />;
};

DomainsSelect.propTypes = {
    member: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    user: PropTypes.object,
    domains: PropTypes.object,
    fetchDomains: PropTypes.func
};

const mapStateToProps = ({ user, domains }) => ({ user, domains });
const mapDispatchToProps = { fetchDomains };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DomainsSelect);
