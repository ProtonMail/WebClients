import React from 'react';
import { c } from 'ttag';
import { Link } from 'react-router-dom';
import {
    SubTitle,
    Alert,
    Row,
    Label,
    Text,
    SmallButton,
    useModal,
    useOrganization,
    InputModal,
    useApiWithoutResult
} from 'react-components';
import { updateOrganizationName } from 'proton-shared/lib/api/organization';
import humanSize from 'proton-shared/lib/helpers/humanSize';

const OrganizationSection = () => {
    const { request } = useApiWithoutResult(updateOrganizationName);
    const [organization] = useOrganization();
    const {
        Name,
        UsedMembers,
        MaxMembers,
        MaxSpace,
        UsedVPN,
        MaxVPN,
        UsedDomains,
        MaxDomains,
        UsedAddresses,
        MaxAddresses
    } = organization;
    const { isOpen, open, close } = useModal();

    const handleSubmit = (name) => async () => {
        await request(name);
        close();
    };

    return (
        <>
            <SubTitle>{c('Title').t`Organization`}</SubTitle>
            <Alert learnMore="todo">{c('Info').t`Lorem ipsum`}</Alert>
            <Row>
                <Label>{c('Label').t`Organization name`}</Label>
                <div>
                    <Text className="mr1">{Name}</Text>
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
            <Row>
                <Label>{c('Label').t`Number of users`}</Label>
                <Text>
                    {`${UsedMembers}/${MaxMembers}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Text>
            </Row>
            <Row>
                <Label>{c('Label').t`Organization storage`}</Label>
                <Text>
                    {humanSize(MaxSpace)} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Text>
            </Row>
            <Row>
                <Label>{c('Label').t`VPN connections`}</Label>
                <Text>
                    {`${UsedVPN}/${MaxVPN}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Text>
            </Row>
            <Row>
                <Label>{c('Label').t`Addresses`}</Label>
                <Text>
                    {`${UsedAddresses}/${MaxAddresses}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Text>
            </Row>
            <Row>
                <Label>{c('Label').t`Domains`}</Label>
                <Text>
                    {`${UsedDomains}/${MaxDomains}`} <Link to="todo">{c('Link').t`Upgrade`}</Link>
                </Text>
            </Row>
        </>
    );
};

export default OrganizationSection;
