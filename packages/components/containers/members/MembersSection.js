import React, { useState, useEffect, useContext } from 'react';
import { c, jt } from 'ttag';
import { Table, TableHeader, SubTitle, Block, PrimaryButton, Alert, LearnMore, Search, useModal, TableBody, TableRow, useSearch } from 'react-components';
import { Link } from 'react-router-dom';
import ContextApi from 'proton-shared/lib/context/api';
import { queryMembers, queryAddresses } from 'proton-shared/lib/api/members';
import { normalize } from 'proton-shared/lib/helpers/string';
import { USER_ROLES } from 'proton-shared/lib/constants';

import MemberModal from './MemberModal';
import MemberActions from './MemberActions';

const MembersSection = () => {
    const { api } = useContext(ContextApi);
    const { keywords, set: setKeywords } = useSearch();
    const [members, setMembers] = useState([]);
    const { isOpen: showNewMemberModal, open: openNewMemberModal, close: closeNewMemberModal } = useModal();
    const handleAddMember = () => openNewMemberModal();
    const handleSearch = (event) => setKeywords(event.target.value);
    const addNewMember = () => {};

    const SUPER_ADMIN_ROLE = 'superman';

    const ROLES = {
        [USER_ROLES.ADMIN_ROLE]: c('User role').t`Admin`,
        [USER_ROLES.MEMBER_ROLE]: c('User role').t`Member`,
        [SUPER_ADMIN_ROLE]: c('User role').t`Primary Admin`
    };

    const search = (members = []) => {
        if (!keywords) {
            return members;
        }

        return members.filter(({ Name }) => {
            return normalize(Name).includes(keywords);
        });
    };

    const fetchAddresses = async (member) => {
        const { Addresses = [] } = await api(queryAddresses(member.ID));

        return {
            ...member,
            addresses: Addresses
        };
    };

    const fetchMembers = async () => {
        const { Members } = await api(queryMembers());
        const m = await Promise.all(Members.map(fetchAddresses));

        setMembers(search(m));
    };

    useEffect(() => {
        fetchMembers();
    }, [keywords]);

    return (
        <>
            <SubTitle>{c('Title').t`Users`}</SubTitle>
            <Alert>
                {c('Info for members section').t`Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`}
                <br />
                <LearnMore url="todo" />
            </Alert>
            <Block>
                <PrimaryButton onClick={handleAddMember}>{c('Action').t`Add user`}</PrimaryButton>
                <MemberModal show={showNewMemberModal} onClose={closeNewMemberModal} onConfirm={addNewMember} />
                <Search onChange={handleSearch} placeholder={c('Placeholder').t`Search for User and Addresses`} />
            </Block>
            <Table>
                <TableHeader cells={[
                    c('Title header for members table').t`Name`,
                    c('Title header for members table').t`Addresses`,
                    c('Title header for members table').t`Role`,
                    c('Title header for members table').t`Private`,
                    c('Title header for members table').t`Storage`,
                    c('Title header for members table').t`Actions`
                ]} />
                <TableBody>
                    {members.map((member) => {
                        const key = member.ID;
                        return <TableRow key={key} cells={[
                            member.Name,
                            <MemberAddresses key={key} member={member} />,
                            ROLES[member.Subscriber ? SUPER_ADMIN_ROLE : member.Role],
                            member.Private,
                            `${member.UsedSpace} / ${member.MaxSpace}`,
                            <MemberActions key={key} member={member} />
                        ]} />;
                    })}
                </TableBody>
            </Table>
            <Alert>{jt`You cad add and manage addresses for the user in your ${<Link to="/settings/addresses">{c('Link').t`Address Settings`}</Link>}`}</Alert>
        </>
    );
};

export default MembersSection;