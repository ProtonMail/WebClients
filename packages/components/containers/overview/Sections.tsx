import React from 'react';
import { hasPermission } from '@proton/shared/lib/helpers/permissions';
import { PERMISSIONS } from '@proton/shared/lib/constants';

import LinkItem from './LinkItem';
import { SubSectionConfig } from '../../components/layout';

interface Props {
    to: string;
    text: string;
    subsections?: SubSectionConfig[];
    permissions?: PERMISSIONS[];
    pagePermissions?: PERMISSIONS[];
}
const Sections = ({ to, subsections = [], text, permissions = [], pagePermissions = [] }: Props) => {
    return (
        <ul className="unstyled mt0-5">
            {subsections.length ? (
                subsections
                    .filter(({ hide }) => !hide)
                    .map(({ text, id, permissions: sectionPermissions }) => {
                        return (
                            <li key={id} className="mt0-5 mb0-5">
                                <LinkItem
                                    to={`${to}#${id}`}
                                    text={text}
                                    permission={hasPermission(permissions, pagePermissions, sectionPermissions)}
                                />
                            </li>
                        );
                    })
            ) : (
                <li>
                    <LinkItem to={to} text={text} permission={hasPermission(permissions, pagePermissions)} />
                </li>
            )}
        </ul>
    );
};

export default Sections;
