import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';
import type { Callback } from '@proton/pass/types';

export type InviteStepAttributes = {
    closeAction: Callback;
    closeIcon: IconName;
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
        <Icon className="modal-close-icon" name={attributes.closeIcon} alt={attributes.closeLabel} />
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
