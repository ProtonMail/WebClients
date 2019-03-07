import React, { useState, useEffect } from 'react';
import { c, jt } from 'ttag';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, TableHeader, SubTitle, Block, Alert, LearnMore, Search, TableBody, TableRow } from 'react-components';
import { Link } from 'react-router-dom';
import { fetchMembers } from 'proton-shared/lib/state/members/actions';
import { normalize } from 'proton-shared/lib/helpers/string';
import { USER_ROLES } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import MemberActions from './MemberActions';
import MemberAddresses from './MemberAddresses';
import AddMemberButton from './AddMemberButton';

const SUPER_ADMIN_ROLE = 'superman';

const ROLES = {
    [USER_ROLES.ADMIN_ROLE]: c('User role').t`Admin`,
    [USER_ROLES.MEMBER_ROLE]: c('User role').t`Member`,
    [SUPER_ADMIN_ROLE]: c('User role').t`Primary Admin`
};

const PRIVATE = {
    0: c('Status for member').t`No`,
    1: c('Status for member').t`Yes`
};

const MembersSection = ({ members, fetchMembers }) => {
    const [keywords, setKeywords] = useState('');
    const [membersSelected, setMembers] = useState(members.data);
    const handleSearch = (value) => setKeywords(value);

    const search = (members = []) => {
        if (!keywords) {
            return members;
        }

        const normalizedWords = normalize(keywords);

        return members.filter(({ Name }) => {
            return normalize(Name).includes(normalizedWords);
        });
    };

    const formatSize = ({ UsedSpace, MaxSpace }) =>
        `${humanSize(UsedSpace, 'GB', true)} / ${humanSize(MaxSpace, 'GB')}`;

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        setMembers(search(members.data));
    }, [keywords, members.data]);

    return (
        <>
            <SubTitle>{c('Title').t`Users`}</SubTitle>
            <Alert>
                {c('Info for members section')
                    .t`Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`}
                <br />
                <LearnMore url="todo" />
            </Alert>
            <Block className="flex flex-spacebetween">
                <AddMemberButton />
                <Search
                    onChange={handleSearch}
                    placeholder={c('Placeholder').t`Search for User and Addresses`}
                    delay={500}
                    value={keywords}
                />
            </Block>
            <Table>
                <TableHeader
                    cells={[
                        c('Title header for members table').t`Name`,
                        c('Title header for members table').t`Addresses`,
                        c('Title header for members table').t`Role`,
                        c('Title header for members table').t`Private`,
                        c('Title header for members table').t`Storage`,
                        c('Title header for members table').t`Actions`
                    ]}
                />
                <TableBody loading={members.loading} colSpan={6}>
                    {membersSelected.map((member) => {
                        const key = member.ID;
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    member.Name,
                                    <MemberAddresses key={key} member={member} />,
                                    ROLES[member.Subscriber ? SUPER_ADMIN_ROLE : member.Role],
                                    PRIVATE[member.Private],
                                    formatSize(member),
                                    <MemberActions key={key} member={member} />
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
            <Alert>{jt`You can add and manage addresses for the user in your ${(
                <Link to="/settings/addresses">{c('Link').t`Address Settings`}</Link>
            )}.`}</Alert>
        </>
    );
};

MembersSection.propTypes = {
    members: PropTypes.object.isRequired,
    fetchMembers: PropTypes.func.isRequired
};

const mapStateToProps = ({ members }) => ({ members });
const mapDispatchToProps = { fetchMembers };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MembersSection);
