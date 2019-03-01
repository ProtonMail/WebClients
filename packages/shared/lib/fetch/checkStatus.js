export default async (response) => {
    const { status } = response;

    if (status >= 200 && status < 300) {
        return response;
    }

    const data = await response.json().catch(() => {});

    const error = new Error(response.statusText);
    error.response = response;
    error.status = status;
    error.data = data;

    throw error;
};
