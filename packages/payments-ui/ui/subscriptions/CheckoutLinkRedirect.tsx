import { Redirect, useLocation, useParams } from 'react-router-dom';

interface CheckoutLinkParams {
    plan: string;
}

export const getCheckoutLinkRoutePath = (pathPrefix = '') => `${pathPrefix}/checkout/:plan`;

export const CheckoutLinkRedirect = ({ dashboardPath }: { dashboardPath: string }) => {
    const { search, hash } = useLocation();
    const { plan } = useParams<CheckoutLinkParams>();

    const searchWithPlan = new URLSearchParams(search);
    searchWithPlan.set('plan', plan);

    return <Redirect to={{ pathname: dashboardPath, search: `?${searchWithPlan}`, hash }} />;
};
