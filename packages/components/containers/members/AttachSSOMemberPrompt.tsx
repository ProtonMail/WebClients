import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    member: Member;
}

const AttachSSOMemberPrompt = ({ member, onClose, ...rest }: Props) => {
    const name = <b key="member">{getMemberEmailOrName(member)}</b>;

    return (
        <Prompt
            title={c('Title').t`User converted to SSO`}
            buttons={[
                <Button color="weak" onClick={onClose}>
                    {c('Action').t`Got it`}
                </Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <div className="text-break mb-2">{c('sso').jt`The user ${name} is now a single sign-on account.`}</div>
            <div>
                {getBoldFormattedText(
                    c('sso')
                        .t`For this user to be able to sign in, make sure that they exist in your identity provider.`
                )}
            </div>
        </Prompt>
    );
};

export default AttachSSOMemberPrompt;
