import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';

import { setParamsInLocation } from 'proton-mail/helpers/mailboxUrl';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

export const MoveBackButton = () => {
    const labelID = useMailSelector(selectLabelID);

    const history = useHistory();

    const handleBack = () => {
        history.push(setParamsInLocation(history.location, { labelID }));
    };

    return (
        <ToolbarButton
            icon={<IcArrowLeft alt={c('Action').t`Back`} />}
            onClick={handleBack}
            data-testid="toolbar:back-button"
            className="rtl:mirror"
        />
    );
};
