import { c } from 'ttag';

import { Href, Spotlight, useSpotlightShow } from '@proton/components/components';
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
                    <div className="text-bold text-lg mauto">{c('Spotlight').t`Message Content Search`}</div>
                    {c('Spotlight').t`You can now search the content of your encrypted emails.`}
                    <br />
                    <Href url={getKnowledgeBaseUrl('/search-message-content')} title="Message Content Search">
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
