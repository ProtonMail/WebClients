import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    icon: React.JSX.Element;
    knowledgeBaseUrlPath: string;
    children: ReactNode;
}

const GroupInfoBanner = ({ icon, knowledgeBaseUrlPath, children }: Props) => {
    return (
        <Banner icon={icon} contentWrapperClassName="flex items-center">
            <span className="flex gap-1">
                {children}
                <Href href={getKnowledgeBaseUrl(knowledgeBaseUrlPath)} className="color-primary inline-block">
                    {c('Link').t`Learn more`}
                </Href>
            </span>
        </Banner>
    );
};

export default GroupInfoBanner;
