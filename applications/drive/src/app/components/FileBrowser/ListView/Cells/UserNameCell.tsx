import { useUser } from '@proton/account/user/hooks';

export const UserNameCell = ({ signatureEmail }: { signatureEmail: string }) => {
    const [{ Email, DisplayName }] = useUser();

    const nameToDisplay = Email === signatureEmail && DisplayName ? DisplayName : signatureEmail;
    return (
        <div key="userName" title={nameToDisplay} className="text-ellipsis">
            <span className="text-pre">{nameToDisplay}</span>
        </div>
    );
};
