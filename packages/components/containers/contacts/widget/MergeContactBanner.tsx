import React from 'react';
import { c } from 'ttag';

import { Icon, InlineLinkButton } from '../../../components';

interface Props {
    onMerge: () => void;
    mergeContactBannerRef: React.RefObject<HTMLDivElement>;
}

const MergeContactBanner = ({ onMerge, mergeContactBannerRef }: Props) => {
    const mergeAction = <InlineLinkButton onClick={onMerge} key="mergeAction">{c('Action').t`Merge`}</InlineLinkButton>;

    return (
        <div
            ref={mergeContactBannerRef}
            className="pl2 pr2 pt1 pb1 bg-weak flex flex-items-align-center flex-nowrap border-bottom"
        >
            <Icon name="merge" className="mr0-5" />
            <span>{c('Info, no need for singular').jt`Multiple contacts look identical. ${mergeAction}`}</span>
        </div>
    );
};

export default MergeContactBanner;
