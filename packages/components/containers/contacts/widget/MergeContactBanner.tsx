import { c, msgid } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';

interface Props {
    onMerge: () => void;
    countMergeableContacts: number;
}

const MergeContactBanner = ({ onMerge, countMergeableContacts }: Props) => {
    const mergeAction = (
        <InlineLinkButton
            className="ml-1"
            onClick={onMerge}
            key="mergeAction"
            data-testid="contacts:merge-contacts-button"
        >{c('Action').t`Merge`}</InlineLinkButton>
    );

    const mergeText = c('Success').ngettext(
        msgid`${countMergeableContacts} contact look identical.`,
        `${countMergeableContacts} contacts look identical.`,
        countMergeableContacts
    );

    return (
        <div className="px-4 py-2 text-sm bg-weak border-bottom">
            <span>
                {mergeText}
                {mergeAction}
            </span>
        </div>
    );
};

export default MergeContactBanner;
