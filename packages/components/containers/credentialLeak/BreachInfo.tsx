import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';

interface BreachInfoProps {
    inModal?: boolean;
    exposedData:
        | null
        | {
              code: string;
              name: string;
          }[];
}

export const encryptedPasswordCode = 'encrypted_password';

const BreachInfo = ({ inModal = false, exposedData }: BreachInfoProps) => {
    return (
        <>
            {inModal ? (
                <div className="flex flex-nowrap items-center">
                    <h2 className="text-semibold text-rg pr-1">{c('Title').t`Information exposed in breach`}</h2>
                    <Info title={c('Tooltip').t`Not all information listed here was exposed for all users.`} />
                </div>
            ) : (
                <div className="flex flex-nowrap items-center">
                    <h3 className="text-semibold text-rg pr-1">{c('Title').t`Information exposed in breach`}</h3>
                    <Info title={c('Tooltip').t`Not all information listed here was exposed for all users.`} />
                </div>
            )}
            <div className="flex gap-2 justify-start mb-4">
                {exposedData?.map((data) => {
                    return (
                        <span
                            className="text-sm rounded-full bg-weak inline-block px-3 py-0.5 flex flex-nowrap items-center"
                            key={`${data.code}${data.name}`}
                        >
                            {data.name}
                            {data.code === encryptedPasswordCode && (
                                <Info
                                    className="pl-1"
                                    title={c('Tooltip')
                                        .t`Unless they are deciphered, encrypted passwords remain secure even if they are exposed.`}
                                />
                            )}
                        </span>
                    );
                })}
            </div>
        </>
    );
};

export default BreachInfo;
