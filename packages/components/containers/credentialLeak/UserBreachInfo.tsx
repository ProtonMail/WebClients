import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

interface UserBreachInfoProps {
    email: string;
    passwordLastChars: string | null;
    style: {
        backgroundClass: string;
        colorClass: string;
        iconAltText: string;
    };
}
const UserBreachInfo = ({ email, passwordLastChars, style }: UserBreachInfoProps) => {
    const { backgroundClass } = style;

    return (
        <>
            <h4 className="text-semibold text-rg">{c('Title').t`Your Exposed Information`}</h4>
            <div
                className={clsx(
                    'flex justify-start flex-nowrap h-custom gap-6 py-3 px-4 overflow-x-auto *:min-size-auto rounded mb-2',
                    backgroundClass
                )}
                style={{ '--h-custom': '3.75rem' }}
            >
                <div className="flex flex-column flex-nowrap *:min-size-auto ">
                    <span className="block text-sm text-semibold">{c('Title').t`Email address`}</span>
                    <span className="block m-0 text-sm">{email}</span>
                </div>
                {passwordLastChars && (
                    <div className="flex flex-column flex-nowrap *:min-size-auto ">
                        <span className="block text-sm text-semibold">{c('Title').t`Password`}</span>
                        <span className="block m-0 text-sm">{passwordLastChars}</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserBreachInfo;
