import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useBYOEMobile } from '../context/BYOEMobileProvider';
import type { ErrorPromptAction, ErrorPromptButtonAction } from './getBYOEErrorPrompt';
import { getBYOEErrorPrompt } from './getBYOEErrorPrompt';

const getButton = (
    { label, action }: { label: string; action: ErrorPromptButtonAction },
    isPrimary: boolean,
    onAction: (action: ErrorPromptAction) => void
): JSX.Element => {
    const color = isPrimary ? 'norm' : undefined;
    if (action.type === 'kb-link') {
        return (
            <ButtonLike key={label} as={Href} color={color} href={getKnowledgeBaseUrl(action.path)}>
                {label}
            </ButtonLike>
        );
    }

    return (
        <Button key={label} color={color} onClick={() => onAction(action)}>
            {label}
        </Button>
    );
};

export const ErrorPrompt = () => {
    const { error, connectingEmail, dismissError, retry, claimAddress } = useBYOEMobile();

    // The email is only known once the code was exchanged. For a wrong account it would be the account that was
    // connected by mistake, not the one the user must pick, so the generic copy is used.
    const config = error
        ? getBYOEErrorPrompt(error, error.type === 'linked-to-another-account' ? connectingEmail : undefined)
        : null;
    if (!error || !config) {
        return null;
    }

    const onAction = (action: ErrorPromptAction) => {
        switch (action.type) {
            case 'retry':
                retry();
                break;
            case 'claim':
                dismissError();
                if (error.type === 'claimable-address') {
                    void claimAddress(error);
                }
                break;
            case 'close':
                dismissError();
                break;
        }
    };

    const buttons: [JSX.Element] | [JSX.Element, JSX.Element] = config.secondary
        ? [getButton(config.primary, true, onAction), getButton(config.secondary, false, onAction)]
        : [getButton(config.primary, true, onAction)];

    return (
        <Prompt open disableCloseOnEscape title={config.title} buttons={buttons}>
            <p className="m-0 text-break">{config.body}</p>
            {config.kbLink && (
                <p className="mt-2 mb-0">
                    <Href href={getKnowledgeBaseUrl(config.kbLink.path)}>{config.kbLink.label}</Href>
                </p>
            )}
        </Prompt>
    );
};
