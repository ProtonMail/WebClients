import { c } from 'ttag';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components/components';

export const AdministratorItem = ({ name, email }: { name: string; email: string }) => {
    return (
        <div className="w-full flex flex-column gap-1">
            <div className="w-full text-ellipsis">
                <span className="text-bold" title={name}>
                    {name}
                </span>
            </div>
            <div className="w-full text-ellipsis text-sm" title={email}>
                {email}
            </div>
        </div>
    );
};

const AdministratorList = ({
    members,
    expandByDefault,
}: {
    members?: { member: { Name: string; ID: string }; email: string }[] | null;
    expandByDefault?: boolean;
}) => {
    if (!members?.length) {
        return null;
    }

    return (
        <Collapsible expandByDefault={expandByDefault}>
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
                        return <AdministratorItem key={member.ID} name={member.Name} email={email} />;
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default AdministratorList;
