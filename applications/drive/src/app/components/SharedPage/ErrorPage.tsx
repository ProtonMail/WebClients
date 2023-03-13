import { Icon } from '@proton/components';

import SharedPageLayout from './SharedPageLayout';

interface Props {
    error: string;
}

export default function ErrorPage({ error }: Props) {
    return (
        <SharedPageLayout>
            <div className="flex flex-column flex-align-items-center flex-justify-center w100 h100">
                <h3 className="text-center">{error}</h3>
                <Icon name="exclamation-circle" size={110} className="fill-primary" />
            </div>
        </SharedPageLayout>
    );
}
