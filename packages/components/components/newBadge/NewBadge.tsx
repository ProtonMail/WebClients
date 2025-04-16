import { c } from 'ttag';

const NewBadge = () => (
    <span className="new-badge flex items-center rounded color-primary bg-weak shrink-0 text-ellipsis text-semibold text-sm mt-1 mx-auto">
        <span>{c('Info').t`New`}</span>
    </span>
);

export default NewBadge;
