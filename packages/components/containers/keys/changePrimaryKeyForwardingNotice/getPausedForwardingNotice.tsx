import { c } from 'ttag';

import { getMailRouteTitles } from '../../account/constants/settingsRouteTitles';

const getPausedForwardingNotice = () => {
    const autoReplySettingsTitle = getMailRouteTitles().autoReply;
    return c('Info')
        .t`Your existing end-to-end encrypted forwardings towards other users will be paused. You can manually re-enable them under the '${autoReplySettingsTitle}' settings.`;
};

export default getPausedForwardingNotice;
