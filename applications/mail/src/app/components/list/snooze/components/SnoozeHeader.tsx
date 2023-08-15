import { c } from 'ttag';

interface Props {
    headerClasses: string;
}

const SnoozeHeader = ({ headerClasses }: Props) => {
    return (
        <div className={headerClasses}>
            <h2 className="mb-1 text-rg text-bold">{c('Snooze message').t`Snooze Message`}</h2>
            <p className="m-0 color-weak">{c('Snooze message').t`When should the message reappear in your inbox?`}</p>
        </div>
    );
};

export default SnoozeHeader;
