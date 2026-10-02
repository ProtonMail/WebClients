import { Button } from '@proton/atoms/Button/Button';
import type { IconComponent } from '@proton/icons/component';

import type { Callback } from '../../../types';

export type InviteStepAttributes = {
    closeAction: Callback;
    closeIcon: IconComponent;
    closeLabel: string;
    submitDisabled?: boolean;
    submitLoading?: boolean;
    submitText: string;
};

export const InviteStepActions = (formID: string, attributes: InviteStepAttributes) => [
    <Button
        className="shrink-0"
        disabled={attributes.submitLoading}
        icon
        key="modal-close-button"
        onClick={attributes.closeAction}
        pill
        shape="solid"
    >
        <attributes.closeIcon className="modal-close-icon" alt={attributes.closeLabel} />
    </Button>,
    <Button
        color="norm"
        disabled={attributes.submitDisabled}
        form={formID}
        key="modal-submit-button"
        loading={attributes.submitLoading}
        pill
        type="submit"
    >
        {attributes.submitText}
    </Button>,
];
