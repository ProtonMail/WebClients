import { c } from 'ttag';

import { CircleLoader, Icon } from '@proton/components';

import SharedPageLayout from './SharedPageLayout';

interface Props {
    stage: 'auth' | 'share';
}

export default function LoadingPage({ stage }: Props) {
    return (
        <SharedPageLayout>
            <div className="flex flex-column flex-align-items-center flex-justify-center w100 h100">
                <CircleLoader size="large" className="shared-page-layout-loader" />
                <div className="mt2">
                    <div className="mb0-5">
                        <Icon name={stage === 'auth' ? 'circle' : 'checkmark'} /> {c('Title').t`Getting files`}
                    </div>
                    <div>
                        <Icon name="circle" /> {c('Title').t`Decrypting`}
                    </div>
                </div>
            </div>
        </SharedPageLayout>
    );
}
