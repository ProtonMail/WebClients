import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

export const PreJoinDetailsShell = ({
    children,
    preHeader,
    header,
    actions,
    loading,
}: {
    preHeader?: React.ReactNode;
    children: React.ReactNode;
    header: React.ReactNode;
    actions?: React.ReactNode[];
    loading: boolean;
}) => {
    return (
        <div
            className="pre-join-details-container flex flex-nowrap flex-column mt-0 gap-2 lg:py-4 lg:gap-4 w-full md:w-custom flex-none md:flex-1 lg:flex-none md:justify-center items-center"
            style={{ '--md-w-custom': '25rem' }}
        >
            {loading ? (
                <div className="flex flex-column items-center justify-center gap-2 pt-10 lg:pt-0">
                    <CircleLoader
                        aria-hidden="true"
                        className="color-primary w-custom h-custom"
                        style={{ '--w-custom': '5.3rem', '--h-custom': '5.3rem', '--stroke-width': 1.3 }}
                    />
                    <span className="text-rg color-weak">{c('Info').t`Loading meeting details...`}</span>
                </div>
            ) : (
                <>
                    {preHeader}
                    <div className="pre-join-details-header flex flex-column gap-2 py-2 lg:py-4 w-full">{header}</div>
                    <div className="flex flex-column gap-2 lg:gap-4 w-full">{children}</div>
                    {actions}
                </>
            )}
        </div>
    );
};
