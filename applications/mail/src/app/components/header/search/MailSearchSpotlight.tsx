import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature, useWelcomeFlags } from '@proton/components/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    children: React.ReactElement;
    canShow: boolean;
}

const MailSearchSpotlight = ({ children, canShow }: Props) => {
    const [welcomeFlags] = useWelcomeFlags();

    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightEncryptedSearch,
        !welcomeFlags.isWelcomeFlow && canShow
    );
    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    return (
        <Spotlight
            originalPlacement="bottom"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            content={
                <>
                    <div className="text-bold text-lg m-auto">{c('Spotlight')
                        .t`Search just got smarter and faster`}</div>
                    {c('Spotlight').t`Try it today.`}
                    <br />
                    <Href href={getKnowledgeBaseUrl('/search-message-content')} title="Message Content Search">
                        {c('Info').t`Learn more`}
                    </Href>
                </>
            }
        >
            {children}
        </Spotlight>
    );
};

export default MailSearchSpotlight;
