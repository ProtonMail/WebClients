//
// AutoFillError.swift
// Proton Pass - Created on 25/09/2025.
// Copyright (c) 2025 Proton Technologies AG
//
// This file is part of Proton Pass.
//
// Proton Pass is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Proton Pass is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Proton Pass. If not, see https://www.gnu.org/licenses/.

enum AutoFillError: Error, CustomDebugStringConvertible {
    case delegateNotSet
    case canNotCompletePasskeyRegistration
    case recordIdentifierNotFound
    case unknownCredentialRequest
    case itemNotFound(String)
    case notLoginItem(String)
    case loginHasNoTotp(String)
    case noMatchedPasskey(combinedId: String,
                          relyingPartyId: String,
                          userName: String)

    var debugDescription: String {
        switch self {
        case .delegateNotSet:
            "Delegate not set"

        case .canNotCompletePasskeyRegistration:
            "Can not complete passkey registration"

        case .recordIdentifierNotFound:
            "Record identifier not found"

        case .unknownCredentialRequest:
            "Unknown credential request"

        case let .itemNotFound(combinedId):
            "Item not found for combined ID \(combinedId)"

        case let .notLoginItem(combinedId):
            "Not login item for combined ID \(combinedId)"

        case let .loginHasNoTotp(combinedId):
            "Login item has no TOTP URI for combined ID \(combinedId)"

        case let .noMatchedPasskey(combinedId, relyingPartyId, userName):
            "No passkey combined ID \(combinedId), relying party ID \(relyingPartyId), username \(userName)"
        }
    }
}
