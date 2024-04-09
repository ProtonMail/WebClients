import { c } from 'ttag';

interface UserBreachInfoProps {
    email: string;
    passwordLastChars: string | null;
    inModal?: boolean;
}
const UserBreachInfo = ({ email, passwordLastChars, inModal = false }: UserBreachInfoProps) => {
    return (
        <>
            {inModal ? (
                <h2 className="text-semibold text-rg mb-2">{c('Title').t`Details`}</h2>
            ) : (
                <h3 className="text-semibold text-rg mb-2">{c('Title').t`Details`}</h3>
            )}
            <div className="mb-4">
                <div className="flex flex-nowrap flex-column sm:flex-row w-full text-sm mb-2">
                    <span className="sm:w-1/3 color-weak">{c('Title').t`Email address`}</span>
                    <span className="sm:flex-1 pl-2 sm:pl-O text-ellipsis" title={email}>
                        {email}
                    </span>
                </div>
                {passwordLastChars && (
                    <div className="flex flex-nowrap flex-column sm:flex-row w-full text-sm mb-2">
                        <span className="sm:w-1/3 color-weak">{c('Title').t`Password`}</span>
                        <span className="sm:flex-1 pl-2 sm:pl-O text-ellipsis" title={passwordLastChars}>
                            {passwordLastChars}
                        </span>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserBreachInfo;
