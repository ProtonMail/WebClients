import { c, msgid } from 'ttag';

import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Icon from '@proton/components/components/icon/Icon';

export const AdministratorItem = ({ name, email }: { name: string; email: string }) => {
    return (
        <div className="w-full text-ellipsis">
            <span className="text-bold" title={name}>
                {name}
            </span>{' '}
            {email && email !== name && (
                <span className="color-weak" title={email}>
                    ({email})
                </span>
            )}
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

    const n = members.length;

    return (
        <Collapsible expandByDefault={expandByDefault}>
            <CollapsibleHeader
                disableFullWidth
                suffix={
                    <CollapsibleHeaderIconButton size="small" color="norm">
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <label className="color-primary">
                    {c('Label').ngettext(msgid`Show ${n} administrator`, `Show ${n} administrators`, n)}
                </label>
            </CollapsibleHeader>

            <CollapsibleContent>
                <div className="border border-weak rounded p-2 flex flex-column gap-1">
                    {members.map(({ member, email }) => {
                        return <AdministratorItem key={member.ID} name={member.Name} email={email} />;
                    })}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default AdministratorList;
