import { Icon } from '@proton/components';

import SharedPageLayout from './SharedPageLayout';

interface Props {
    error: string;
}

export default function ErrorPage({ error }: Props) {
    return (
        <SharedPageLayout small>
            <div className="flex flex-column flex-align-items-center flex-justify-center w100 h100">
                <h2>{error}</h2>
                <Icon name="exclamation-circle" size={110} className="fill-primary" />
            </div>
        </SharedPageLayout>
    );
}
