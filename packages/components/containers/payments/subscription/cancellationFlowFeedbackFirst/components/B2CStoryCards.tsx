import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import alias from '@proton/styles/assets/img/cancellation-flow/testimonial_alias.png';
import darkWeb from '@proton/styles/assets/img/cancellation-flow/testimonial_dark_web.png';
import netShield from '@proton/styles/assets/img/cancellation-flow/testimonial_net_shield.png';

import StoryCard from './StoryCard';

export const B2CStoryCards = () => {
    return (
        <div className="flex gap-6 pt-4">
            <StoryCard
                image={alias}
                title={c('Title').t`Our fight against censorship in Russia`}
                subtitle={c('Description')
                    .t`How we fought back when ${BRAND_NAME} was blocked in an aggressive campaign.`}
                linkText={c('Action').t`Read the story`}
                url="https://www.nytimes.com/2022/12/06/technology/russia-internet-proton-vpn.html"
            />
            <StoryCard
                image={darkWeb}
                title={c('Title').t`Helping activists in Hong Kong`}
                subtitle={c('Description')
                    .t`How we supported local activists when privacy and free speech were threatened.`}
                linkText={c('Action').t`Watch the interview`}
                url="https://www.youtube.com/watch?v=QmFTporQpM8"
            />
            <StoryCard
                image={netShield}
                title={c('Title').t`Unblocking internet access in Iran`}
                subtitle={c('Description')
                    .t`How our customer support team got our VPN app directly into people's hands.`}
                linkText={c('Action').t`Read the story`}
                url="https://www.pcmag.com/opinions/proton-vpns-new-stealth-feature-helps-fight-censorship-in-iran-and-russia"
            />
        </div>
    );
};
