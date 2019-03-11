import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { SubTitle, Alert, Row, Label, SmallButton, useModal, InputModal } from 'react-components';
import { updateOrganizationName } from 'proton-shared/lib/api/organization';

import useApi from '../../hooks/useApi';

const OrganizationSection = ({ organization }) => {
    const api = useApi();
    const { isOpen, open, close } = useModal();
    const { Name = '' } = organization.data;
    const handleSubmit = (name) => async () => {
        await api(updateOrganizationName(name));
        close();
    };

    return (
        <>
            <SubTitle>{c('Title').t`Organization`}</SubTitle>
            <Alert learnMore="todo">{c('Info').t`Lorem ipsum`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <div>
                    <span className="pm-label mr1">{Name}</span>
                    <SmallButton onClick={open}>{c('Action').t`Edit`}</SmallButton>
                    <InputModal
                        show={isOpen}
                        input={Name}
                        title={c('Title').t`Change organization name`}
                        label={c('Label').t`Organization name`}
                        placeholder={c('Placeholder').t`Choose a name`}
                        onClose={close}
                        onSubmit={handleSubmit}
                    />
                </div>
            </Row>
        </>
    );
};

OrganizationSection.propTypes = {
    organization: PropTypes.object.isRequired
};

const mapStateToProps = ({ organization }) => ({ organization });

export default connect(mapStateToProps)(OrganizationSection);
