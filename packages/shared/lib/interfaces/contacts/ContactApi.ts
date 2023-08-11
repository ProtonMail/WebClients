import { ContactMetadata } from './Contact';

export interface AddContactsApiResponse {
    Index: number;
    Response: {
        Code: number;
        Contact?: ContactMetadata;
        Error?: string;
    };
}

export interface AddContactsApiResponses {
    Code: number;
    Responses: AddContactsApiResponse[];
}

export interface UpdateContactApiResponse {
    Code: number;
    Contact?: ContactMetadata;
}
