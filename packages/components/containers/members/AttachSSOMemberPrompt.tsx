import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import { getMemberEmailOrName } from '@proton/shared/lib/keys/memberHelper';

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    member: Member;
}

const AttachSSOMemberPrompt = ({ member, onClose, ...rest }: Props) => {
    const name = member.Name;
    const email = getMemberEmailOrName(member);
    const user = (
        <b key="member">
            {name !== email && <>{name} </>}({email})
        </b>
    );

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
            <div className="text-break mb-2">{c('sso')
                .jt`The user ${user} is now a single sign-on account. Their previous password became their backup password.`}</div>
            <div>
                {c('sso')
                    .t`They will have to sign in again with your identity provider to access ${BRAND_NAME} services. For this user to be able to sign in, make sure that they exist in your identity provider.`}
            </div>
        </Prompt>
    );
};

export default AttachSSOMemberPrompt;
