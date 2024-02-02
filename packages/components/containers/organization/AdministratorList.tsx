import { ReactNode } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components/components';

const AdministratorList = ({
    loading,
    members,
    children,
    expandByDefault,
}: {
    loading: boolean;
    members?: { member: { Name: string; ID: string }; email: string }[] | null;
    children?: ReactNode;
    expandByDefault?: boolean;
}) => {
    if (loading) {
        return (
            <div className="mt-4 text-center">
                <CircleLoader />
            </div>
        );
    }

    if (!members?.length) {
        return null;
    }

    return (
        <div className="mt-4">
            {children}
            <Collapsible className="mt-4" expandByDefault={expandByDefault}>
                <CollapsibleHeader
                    disableFullWidth
                    suffix={
                        <CollapsibleHeaderIconButton size="small">
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    <label className="text-semibold">{c('Label').t`Administrators`}</label>
                </CollapsibleHeader>

                <CollapsibleContent>
                    <div className="flex flex-column gap-2">
                        {members.map(({ member, email }) => {
                            return (
                                <div key={member.ID} className="w-full flex flex-column gap-1">
                                    <div className="w-full text-ellipsis">
                                        <span className="text-bold" title={member.Name}>
                                            {member.Name}
                                        </span>
                                    </div>
                                    <div className="w-full text-ellipsis text-sm" title={email}>
                                        {email}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

export default AdministratorList;
