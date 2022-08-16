import { c, msgid } from 'ttag';

import { InlineLinkButton } from '../../../components';

interface Props {
    onMerge: () => void;
    countMergeableContacts: number;
}

const MergeContactBanner = ({ onMerge, countMergeableContacts }: Props) => {
    const mergeAction = (
        <InlineLinkButton
            className="ml0-25"
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
        <div className="px1 py0-5 bg-weak border-bottom">
            <span>
                {mergeText}
                {mergeAction}
            </span>
        </div>
    );
};

export default MergeContactBanner;
