import { c } from 'ttag';

import './ParticipantListContainer.scss';

export const ParticipantListContainer = ({
    title,
    setIsScrolled,
    participantsList,
    agentsList,
}: {
    title: string;
    setIsScrolled: (isScrolled: boolean) => void;
    participantsList: React.ReactNode;
    agentsList?: React.ReactNode;
}) => {
    return (
        <div
            className="flex-1 overflow-y-auto w-full h-full participants-list px-4"
            onScroll={(event) => {
                setIsScrolled(event.currentTarget.scrollTop > 0);
            }}
        >
            <h2 className="sr-only">{title}</h2>
            {agentsList && (
                <>
                    <div className="category pt-4 pb-4">{c('Title').t`System`}</div>
                    <ul className="unstyled m-0 p-0 flex flex-column flex-nowrap gap-4">{agentsList}</ul>
                    <div className="category pt-4 pb-4">{c('Title').t`People`}</div>
                </>
            )}
            <ul className="unstyled m-0 p-0 flex flex-column flex-nowrap gap-4">{participantsList}</ul>
        </div>
    );
};
