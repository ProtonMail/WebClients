import { IcUser } from '@proton/icons/icons/IcUser';

interface Props {
    username: string | undefined;
}

export const UserNameWithIcon = ({ username }: Props) => {
    return (
        <span className="flex items-center gap-2" data-testid="recovery:username">
            <IcUser />
            {username}
        </span>
    );
};
