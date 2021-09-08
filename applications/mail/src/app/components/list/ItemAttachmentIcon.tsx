import { c, msgid } from 'ttag';
import { classnames, Icon, Tooltip } from '@proton/components';

import { getNumAttachments } from '../../helpers/elements';
import { Element } from '../../models/element';

interface Props {
    element?: Element;
    className?: string;
    icon?: string;
}

const ItemAttachmentIcon = ({ element = {}, className, icon = 'paperclip' }: Props) => {
    const numAttachments = getNumAttachments(element);

    if (numAttachments === 0) {
        return null;
    }

    const title = icon.includes('calendar')
        ? c('Calendar attachment tooltip').t`Has a calendar event`
        : c('Info').ngettext(
              msgid`Has ${numAttachments} attachment`,
              `Has ${numAttachments} attachments`,
              numAttachments
          );

    return (
        <Tooltip title={title}>
            <div className={classnames(['flex', className])} data-testid="item-attachment-icon">
                <Icon name={icon} size={14} alt={title} />
            </div>
        </Tooltip>
    );
};

export default ItemAttachmentIcon;
