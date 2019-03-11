import React, { useEffect } from 'react';
import { c } from 'ttag';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { SubTitle, Alert, PrimaryButton, Button, Block, useModal } from 'react-components';
import { fetchDomains } from 'proton-shared/lib/state/domains/actions';

import DomainModal from './DomainModal';
import DomainsTable from './DomainsTable';

const DomainsSection = ({ organization, domains, fetchDomains }) => {
    const { isOpen, open, close } = useModal();
    const { UsedDomains, MaxDomains } = organization.data;

    useEffect(() => {
        fetchDomains();
    }, []);

    return (
        <>
            <SubTitle>{c('Title').t`Domains`}</SubTitle>
            <Alert learnMore="todo">
                {c('Message')
                    .t`Add a custom filter to perform actions such as automatically labeling or archiving messages.`}
            </Alert>
            <Block>
                <PrimaryButton onClick={open}>{c('Action').t`Add domain`}</PrimaryButton>
                <DomainModal show={isOpen} onClose={close} />
                <Button disabled={domains.loading} onClick={fetchDomains}>{c('Action').t`Refresh status`}</Button>
            </Block>
            <DomainsTable loading={domains.loading} domains={domains.data} />
            <Block>
                {UsedDomains} / {MaxDomains} {c('Info').t`domains used`}
            </Block>
        </>
    );
};

DomainsSection.propTypes = {
    organization: PropTypes.object.isRequired,
    domains: PropTypes.object.isRequired,
    fetchDomains: PropTypes.func.isRequired
};

const mapStateToProps = ({ domains, organization }) => ({ domains, organization });
const mapDispatchToProps = { fetchDomains };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DomainsSection);
