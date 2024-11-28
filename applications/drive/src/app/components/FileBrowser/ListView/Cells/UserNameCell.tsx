import { useUser } from '@proton/account/user/hooks';

export const UserNameCell = ({ signatureEmail }: { signatureEmail: string }) => {
    const [{ Name, Email }] = useUser();

    const nameToDisplay = Email === signatureEmail ? Name : signatureEmail;
    return (
        <div key="userName" title={Name} className="text-ellipsis">
            <span className="text-pre">{nameToDisplay}</span>
        </div>
    );
};
