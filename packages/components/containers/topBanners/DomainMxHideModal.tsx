import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { Domain } from '@proton/shared/lib/interfaces/Domain';

import type { PromptProps } from '../../components/prompt/Prompt';
import Prompt from '../../components/prompt/Prompt';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    domains: Domain[];
    onHide: () => void;
}

const getUnreachableDomainsWarning = (domains: Domain[]) => {
    if (domains.length === 1) {
        const domainName = domains[0].DomainName;
        return c('Info')
            .t`You won't receive emails at ${domainName} until you activate ${MAIL_APP_NAME}. You can do this anytime in Settings > Domain names.`;
    }

    const count = domains.length;
    return c('Info').ngettext(
        msgid`You won't receive emails at ${count} of your domains until you activate ${MAIL_APP_NAME}. You can do this anytime in Settings > Domain names.`,
        `You won't receive emails at ${count} of your domains until you activate ${MAIL_APP_NAME}. You can do this anytime in Settings > Domain names.`,
        count
    );
};

const DomainMxHideModal = ({ domains, onHide, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Hide this reminder?`}
            buttons={[
                <Button color="norm" onClick={onHide}>{c('Action').t`Hide`}</Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {getUnreachableDomainsWarning(domains)}
        </Prompt>
    );
};

export default DomainMxHideModal;
