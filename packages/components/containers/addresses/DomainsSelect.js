import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchDomains } from 'proton-shared/lib/state/domains/actions';
import { queryAvailableDomains, queryPremiumDomains } from 'proton-shared/lib/api/domains';
import ContextApi from 'proton-shared/lib/context/api';
import { MEMBER_TYPE } from 'proton-shared/lib/constants';
import { Select } from 'react-components';

import { fakeEvent } from '../../helpers/component';

const DomainsSelect = ({ member, onChange, user, fetchDomains }) => {
    const { api } = useContext(ContextApi);
    const { loading, loaded } = useLoading();
    const [options, setOptions] = useState([]);
    const [domain, setDomain] = useState('');

    const handleChange = (event) => {
        setDomain(event.target.value);
        onChange(event);
    };

    const formatDomains = (domains = []) => domains.reduce((acc, { State, DomainName }) => {
        State && acc.push(DomainName);
        return acc;
    }, []);

    const queryDomains = async () => {
        const [available, premium, domains] = await Promise.all([
            member.Type === MEMBER_TYPE.MEMBER ? api(queryAvailableDomains()).then(({ Domains }) => Domains) : [],
            member.Type === MEMBER_TYPE.MEMBER && user.isPaidMail ? api(queryPremiumDomains()).then(({ Domains }) => Domains) : [],
            user.isPaidMail ? fetchDomains() : []
        ]);
        const domainNames = [].concat(available, premium, formatDomains(domains));

        setOptions(domainNames.map((text) => ({ text, value: text })));
        setDomain(domainNames[0]);
        onChange(fakeEvent(domainNames[0]));
        loaded();
    };

    useEffect(() => {
        queryDomains();
    }, []);

    return <Select disabled={loading} value={domain} options={options} onChange={handleChange} />;
};

DomainsSelect.propTypes = {
    member: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired
};

const mapStateToProps = ({ user }) => ({ user });
const mapDispatchToProps = { fetchDomains };

export default connect(mapStateToProps, mapDispatchToProps)(DomainsSelect);