//
// AutoFillMode.swift
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

import AuthenticationServices

public enum AutoFillMode {
    /// Proton Pass is chosen as credential provider in Settings
    case configuration

    /// User picks a proposed item, we need to finalize the autofill process
    case autoFill(ASCredentialRequest)

    /// User wants to manually pick a login to autofill
    /// If `ASPasskeyCredentialRequestParameters` is present, it's about passkey context
    case showAllLogins([ASCredentialServiceIdentifier], ASPasskeyCredentialRequestParameters?)

    /// User wants to register a passkey
    case passkeyRegistration(any ASCredentialRequest)

    /// Users want to manually select an item to autofill 2FA code
    case showOneTimeCodes([ASCredentialServiceIdentifier])

    /// Users want to manually pick an arbitrary field of any item types to autofill
    case textInsertion
}
