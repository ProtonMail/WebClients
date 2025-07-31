import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import { getMailRouteTitles } from '../../account/constants/settingsRouteTitles';

const getPausedForwardingNotice = () => {
    const autoReplySettingsTitle = getMailRouteTitles().autoReply;
    return getBoldFormattedText(
        c('Info')
            .t`Existing end-to-end encrypted email forwardings will need to be manually re-enabled under **${autoReplySettingsTitle}** in settings.`
    );
};

export default getPausedForwardingNotice;
