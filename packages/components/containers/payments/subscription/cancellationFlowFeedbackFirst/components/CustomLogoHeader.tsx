import CustomLogo, {
    type CustomLogoPlanName,
} from '@proton/components/containers/payments/subscription/YourPlanSectionV2/CustomLogo';

interface Props {
    planName: CustomLogoPlanName;
}

export const CustomLogoHeader = ({ planName }: Props) => {
    return (
        <span
            className="rounded overflow-hidden shrink-0 inline-flex h-custom w-custom"
            style={{ '--w-custom': '1.75rem', '--h-custom': '1.75rem' }}
        >
            <CustomLogo planName={planName} size={28} />
        </span>
    );
};
