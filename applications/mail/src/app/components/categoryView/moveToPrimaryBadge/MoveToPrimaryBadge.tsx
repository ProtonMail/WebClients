import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcInboxFilled } from '@proton/icons/icons/IcInboxFilled';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import type { Element } from 'proton-mail/models/element';

interface Props {
    element: Element;
}

export const MoveToPrimaryBadge = ({ element }: Props) => {
    const { applyLocation } = useApplyLocation();

    const handleClick = () => {
        void applyLocation({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [element],
            destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        });
    };

    return (
        <ButtonLike as="div" size="tiny" onClick={handleClick} className="inline-flex items-center gap-1 rounded-lg">
            <IcInboxFilled className="color-iris-500" />
            <span>{c('Info').t`Move to Primary`}</span>
        </ButtonLike>
    );
};
