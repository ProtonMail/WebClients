import { c } from 'ttag';

import { CircleLoader, Icon } from '@proton/components';

import SharedPageLayout from './SharedPageLayout';

interface Props {
    stage: 'auth' | 'share';
}

export default function LoadingPage({ stage }: Props) {
    return (
        <SharedPageLayout small>
            <div className="flex flex-column flex-align-items-center flex-justify-center w100 h100">
                <CircleLoader size="large" />
                <div className="mt2">
                    <Icon name={stage === 'auth' ? 'circle' : 'checkmark'} /> {c('Title').t`Getting files`}
                    <br />
                    <Icon name="circle" /> {c('Title').t`Decrypting`}
                </div>
            </div>
        </SharedPageLayout>
    );
}
