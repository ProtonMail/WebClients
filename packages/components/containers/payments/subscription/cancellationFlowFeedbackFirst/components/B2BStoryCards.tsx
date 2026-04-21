import { c } from 'ttag';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import compliance from '@proton/styles/assets/img/cancellation-flow/testimonial_compliance.svg';
import connected from '@proton/styles/assets/img/cancellation-flow/testimonial_connceted.svg';
import standOut from '@proton/styles/assets/img/cancellation-flow/testimonial_stand_out.svg';

import StoryCard from './StoryCard';

export const B2BStoryCards = () => {
    return (
        <div className="flex gap-6 pt-4">
            <StoryCard
                image={compliance}
                title={c('Title').t`Support your compliance objectives`}
                subtitle={c('Description')
                    .t`${MAIL_APP_NAME} keeps your business data secure and lets you send encrypted emails to anyone.`}
                linkText={c('Action').t`Learn more`}
                url={getStaticURL('/support/password-protected-emails')}
            />
            <StoryCard
                image={standOut}
                title={c('Title').t`Make your business stand out`}
                subtitle={c('Description')
                    .t`Build trust and brand recognition with professional email addresses at your own domain.`}
                linkText={c('Action').t`Learn more`}
                url={getStaticURL('/support/custom-domain')}
            />
            <StoryCard
                image={connected}
                title={c('Title').t`Stay secure and connected anywhere`}
                subtitle={c('Description')
                    .t`Keep your team secure on the go with our apps for web, iOS, Android, Windows, Mac, and Linux.`}
                linkText={c('Action').t`Read the story`}
                url={getStaticURL('/mail/download')}
            />
        </div>
    );
};
