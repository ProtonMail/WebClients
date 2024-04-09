import { c } from 'ttag';

interface BreachInfoProps {
    inModal?: boolean;
    exposedData:
        | null
        | {
              code: string;
              name: string;
          }[];
}

const BreachInfo = ({ inModal = false, exposedData }: BreachInfoProps) => {
    return (
        <>
            {inModal ? (
                <h2 className="text-semibold text-rg">{c('Title').t`Your exposed information`}</h2>
            ) : (
                <h3 className="text-semibold text-rg">{c('Title').t`Your exposed information`}</h3>
            )}
            <div className="flex gap-2 justify-start mb-4">
                {exposedData?.map((data) => {
                    return (
                        <span
                            className="text-sm rounded-full bg-weak inline-block px-3 py-0.5"
                            key={`${data.code}${data.name}`}
                        >
                            {data.name}
                        </span>
                    );
                })}
            </div>
        </>
    );
};

export default BreachInfo;
