import React, { useMemo } from 'react';
import { Button, useLabels } from 'react-components';
import { c, ngettext, msgid } from 'ttag';

import conversationSingleSvgLight from 'design-system/assets/img/shared/selected-conversation-single.svg';
import conversationSingleSvgDark from 'design-system/assets/img/shared/selected-conversation-single-dark.svg';
import conversationManySvgLight from 'design-system/assets/img/shared/selected-conversation-many.svg';
import conversationManySvgDark from 'design-system/assets/img/shared/selected-conversation-many-dark.svg';
import { LabelCount } from '../../models/label';
import { getLabelName } from '../../helpers/labels';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

interface Props {
    labelCount: LabelCount;
    checkedIDs?: string[];
    onUncheckAll: () => void;
}

const SelectionPane = ({ labelCount, checkedIDs = [], onUncheckAll }: Props) => {
    const [labels] = useLabels();

    const total = labelCount.Total || 0;
    const checkeds = checkedIDs.length;
    const conversationSingleSvg = getLightOrDark(conversationSingleSvgLight, conversationSingleSvgDark);
    const conversationManySvg = getLightOrDark(conversationManySvgLight, conversationManySvgDark);

    const labelName = useMemo(() => getLabelName(labelCount.LabelID || '', labels), [labels, labelCount]);

    return (
        <div className="flex-item-fluid aligncenter p3">
            {checkeds === 0 && labelName && <h3 className="bold">{labelName}</h3>}
            <p className="mb2">
                {checkeds === 0
                    ? ngettext(
                          msgid`You have ${total} stored in this folder`,
                          `You have ${total} stored in this folder`,
                          total
                      )
                    : ngettext(
                          msgid`You selected ${checkeds} element from this folder`,
                          `You selected ${checkeds} elements from this folder`,
                          checkeds
                      )}
            </p>
            <div className="mb2">
                <img
                    src={checkeds > 1 ? conversationManySvg : conversationSingleSvg}
                    alt={c('Alternative text for conversation image').t`Conversation`}
                />
            </div>
            {checkeds > 0 && <Button onClick={onUncheckAll}>{c('Action').t`Deselect`}</Button>}
        </div>
    );
};

export default SelectionPane;
