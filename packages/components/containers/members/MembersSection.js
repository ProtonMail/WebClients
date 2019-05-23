import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Table,
    TableHeader,
    Info,
    SubTitle,
    Block,
    Alert,
    SearchInput,
    TableBody,
    TableRow,
    useMembers
} from 'react-components';
import { Link } from 'react-router-dom';
import { normalize } from 'proton-shared/lib/helpers/string';

import MemberActions from './MemberActions';
import MemberAddresses from './MemberAddresses';
import AddMemberButton from './AddMemberButton';
import MemberFeatures from './MemberFeatures';
import MemberRole from './MemberRole';
import MemberPrivate from './MemberPrivate';
import { useOrganization } from '../../models/organizationModel';

const MembersSection = () => {
    const [members = [], membersLoading] = useMembers();
    const [organization] = useOrganization();
    const [keywords, setKeywords] = useState('');
    const [membersSelected, setMembers] = useState(members);
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

    useEffect(() => {
        setMembers(search(members));
    }, [keywords, members]);

    return (
        <>
            <SubTitle>{c('Title').t`Users`}</SubTitle>
            <Alert learnMore="todo">
                {c('Info for members section')
                    .t`Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`}
            </Alert>
            <Block className="flex flex-spacebetween">
                <AddMemberButton />
                <div>
                    <SearchInput
                        onChange={handleSearch}
                        placeholder={c('Placeholder').t`Search for User and Addresses`}
                        delay={500}
                        value={keywords}
                    />
                </div>
            </Block>
            <Table>
                <TableHeader
                    cells={[
                        c('Title header for members table').t`Name`,
                        <>
                            <span className="mr0-5">{c('Title header for members table').t`Role`}</span>
                            <Info url="https://protonmail.com/support/knowledge-base/member-roles/" />
                        </>,
                        <>
                            <span className="mr0-5">{c('Title header for members table').t`Private`}</span>
                            <Info url="https://protonmail.com/support/knowledge-base/private-members/" />
                        </>,
                        c('Title header for members table').t`Addresses`,
                        c('Title header for members table').t`Features`,
                        c('Title header for members table').t`Actions`
                    ]}
                />
                <TableBody loading={membersLoading} colSpan={6}>
                    {membersSelected.map((member) => {
                        const key = member.ID;
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    member.Name,
                                    <MemberRole key={key} member={member} />,
                                    <MemberPrivate key={key} member={member} />,
                                    <MemberAddresses key={key} member={member} />,
                                    <MemberFeatures key={key} member={member} />,
                                    <MemberActions key={key} member={member} organization={organization} />
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
            <Block>
                {organization.UsedMembers} / {organization.MaxMembers} {c('Info').t`members used`}
            </Block>
            <Alert>
                <span className="mr0-5">{c('Info').t`You can add and manage addresses for the user in your`}</span>
                <Link to="/settings/addresses">{c('Link').t`Address settings`}</Link>
            </Alert>
        </>
    );
};

MembersSection.propTypes = {};

export default MembersSection;
