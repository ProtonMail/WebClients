import { c } from 'ttag';

const EarlyAccessBadge = () => (
    <span className="px-1 inline-flex rounded color-primary bg-weak border border-weak shrink-0 text-ellipsis text-semibold text-xs mt-1 mx-auto">
        {c('Info').t`Early access`}
    </span>
);

export default EarlyAccessBadge;
