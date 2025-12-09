export const serializeFormData = (data: { [key: string]: any }): FormData => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
            data[key].forEach((val: any) => formData.append(key, val));
        } else {
            const value = data[key];
            if (value instanceof Blob) {
                formData.append(key, value, key);
            } else {
                formData.append(key, data[key]);
            }
        }
    });
    return formData;
};

export type FetchDataType = 'json' | 'form' | 'protobuf';
export const serializeData = (data: any, input: FetchDataType): Pick<RequestInit, 'body' | 'headers'> => {
    if (!data) {
        return {};
    }
    if (input === 'json') {
        return {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json',
            },
        };
    }
    if (input === 'form') {
        return {
            body: serializeFormData(data),
        };
    }
    if (input === 'protobuf') {
        return {
            body: data,
            headers: {
                'content-type': 'application/x-protobuf',
            },
        };
    }
    return {};
};
