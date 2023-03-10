import { c } from 'ttag';

import { Icon } from '@proton/components';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

import './HeaderSubtitle.scss';

type Props = {
    size?: number;
};

export const HeaderSubtitle = ({ size }: Props) => {
    const readableSize = shortHumanSize(size);

    return (
        <div className="flex flex-row flex-align-items-center">
            <div className="color-success flex flex-row flex-align-center">
                <Icon name="lock-open-check-filled" className="mr0-5" />
                <span className="encryption-block-text">{c('Info').t`End-to-end encrypted`}</span>
            </div>
            {size ? (
                <>
                    <span className="shared-folder-header-separator ml0-5 mr0-5">•</span>
                    <span className="shared-folder-header-share-size text-pre">{readableSize}</span>
                </>
            ) : null}
        </div>
    );
};
