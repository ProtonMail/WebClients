import { useUser } from '@proton/account/user/hooks';

export const UserNameCell = () => {
    const [{ Name }] = useUser();

    return (
        <div key="userName" title={Name} className="text-ellipsis">
            <span className="text-pre">{Name}</span>
        </div>
    );
};
