import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';

export const LoginErrorBlock = ({ message }: { message: string | undefined }) => {
    if (!message) {
        return null;
    }
    return (
        <div
            data-testid="login:error-block"
            className="mb-4 bg-weak w-full border-none pl-3 pr-4 py-3 gap-3 rounded-lg flex items-start flex-nowrap"
        >
            <div className="flex justify-start items-start shrink-0 pt-0.5">
                <IcExclamationCircleFilled className="color-danger shrink-0" />
            </div>
            {message}
        </div>
    );
};
