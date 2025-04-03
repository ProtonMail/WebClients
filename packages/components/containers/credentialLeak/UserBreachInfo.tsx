import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';

import { encryptedPasswordCode } from './BreachInfo';

interface UserBreachInfoProps {
    inModal?: boolean;
    exposedData: {
        code: string;
        name: string;
        values?: string[];
    }[];
}
const UserBreachInfo = ({ inModal = false, exposedData }: UserBreachInfoProps) => {
    // Filter out empty values, except for "Encrypted password"
    const personalExposedData = exposedData.filter(
        ({ name, values }) => name === 'Encrypted password' || (Array.isArray(values) && values.length !== 0)
    );

    // Hide the entire section if there are no relevant items
    if (personalExposedData.length === 0) {
        return null;
    }

    const breachDetailsDisclaimer = (
        <Info
            className="ml-2"
            title={c('Info')
                .t`Our alerts prioritize safety. If you don’t recognize any of the breached information, you can safely ignore this report.`}
        />
    );

    return (
        <>
            {inModal ? (
                <div className="flex flex-nowrap items-center mb-2">
                    <h2 className="text-semibold text-rg">{c('Title').t`Your exposed information`}</h2>
                    {breachDetailsDisclaimer}
                </div>
            ) : (
                <div className="flex flex-nowrap items-center mb-2">
                    <h3 className="text-semibold text-rg">{c('Title').t`Your exposed information`}</h3>
                    {breachDetailsDisclaimer}
                </div>
            )}
            <div className="mb-4">
                {personalExposedData.map(({ code, name, values }) => {
                    const valuesStr = Array.isArray(values) ? values.join(', ') : '';

                    return (
                        <div className="flex flex-nowrap flex-column sm:flex-row w-full text-sm mb-2" key={name}>
                            <span className="sm:w-1/3 color-weak flex flex-nowrap items-center">
                                {name}
                                {code === encryptedPasswordCode && (
                                    <Info
                                        className="pl-1"
                                        title={c('Tooltip')
                                            .t`Unless they are deciphered, encrypted passwords remain secure even if they are exposed.`}
                                    />
                                )}
                            </span>
                            <span className="sm:flex-1 pl-2 sm:pl-0 text-ellipsis" title={valuesStr}>
                                {valuesStr}
                            </span>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default UserBreachInfo;
