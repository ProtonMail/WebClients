import { Icon } from '@proton/components';

export default function LinkError({ error }: { error: string }) {
    return (
        <>
            <h3 className="text-bold mt2 mb0-25">{error}</h3>
            <div
                style={{ '--height-custom': '9em' }}
                className="flex h-custom flex-column flex-align-items-center flex-justify-center w100 mt2 mb1"
            >
                <Icon name="circle-exclamation" size={110} className="fill-primary" />
            </div>
        </>
    );
}
