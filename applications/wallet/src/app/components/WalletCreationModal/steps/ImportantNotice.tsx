import { c } from 'ttag';

import { Icon } from '@proton/components/components';

export const ImportantNotice = ({ text }: { text: string }) => {
    const important = <span className="color-danger">{c('Wallet setup').t`Important:`}</span>;

    return (
        <div className="flex flex-row flex-nowrap bg-weak rounded-lg p-4 items-center my-4">
            <Icon name="exclamation-circle" className="color-danger shrink-0" />

            <p className="m-0 ml-4">
                {important} {text}
            </p>
        </div>
    );
};
