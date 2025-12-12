import { Icon } from '@proton/components';
import type { FunctionComponent } from 'react';

import { c } from 'ttag';

interface Props {
    enableFoundationSearch: boolean;
}

export const SearchIndexPrivacy: FunctionComponent<Props> = ({ enableFoundationSearch }) => (
    <div className="flex flex-column gap-2 mt-2">
        <div>
            <strong>{c('Info').t`Local encryption:`}</strong>{' '}
            {c('Info').t`Index data is encrypted locally with your keys and stays on your device.`}
        </div>
        <div>
            <strong>{c('Info').t`Drive files:`}</strong>{' '}
            {c('Info').t`Drive documents are downloaded, processed locally, and stored in the encrypted index.`}
        </div>
        {!enableFoundationSearch && (
            <div className="p-2 bg-warning-weak rounded">
                <Icon name="exclamation-triangle-filled" size={4} className="color-warning mr-2" />
                <span className="text-sm">{c('Info').t`Foundation search is disabled in this build.`}</span>
            </div>
        )}
    </div>
);


