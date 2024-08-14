import type { ReactNode } from 'react';

type Props = {
    title: string;
    button: ReactNode;
};

export const UpgradeBanner = ({ title, button }: Props) => {
    return (
        <div
            className="bg-weak p-4 rounded flex flex-nowrap items-center justify-space-between"
            data-testid="revisions-upgrade-banner"
        >
            <p className="mx-0 my-1">{title}</p>
            {button}
        </div>
    );
};
