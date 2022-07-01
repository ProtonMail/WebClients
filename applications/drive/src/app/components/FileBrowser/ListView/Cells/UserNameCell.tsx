import { useUser } from '@proton/components';

export const UserNameCell = () => {
    const [{ Name }] = useUser();

    return (
        <div key="userName" title={Name} className="text-ellipsis">
            <span className="text-pre">{Name}</span>
        </div>
    );
};
