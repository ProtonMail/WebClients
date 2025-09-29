//
// UpdateCredentials.swift
// Proton Pass - Created on 23/05/2024.
// Copyright (c) 2024 Proton Technologies AG
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
//

import Client
import Foundation
import Models

public protocol UpdateCredentialsUseCase: Sendable {
    func execute(_ refreshedTokens: RefreshedTokens) throws
}

public extension UpdateCredentialsUseCase {
    func callAsFunction(_ refreshedTokens: RefreshedTokens) throws {
        try execute(refreshedTokens)
    }
}

public final class UpdateCredentials: Sendable, UpdateCredentialsUseCase {
    private let credentialProvider: any CredentialProvider

    public init(credentialProvider: any CredentialProvider) {
        self.credentialProvider = credentialProvider
    }

    public func execute(_ refreshedTokens: RefreshedTokens) throws {
        guard let credentials = credentialProvider.getCredentials() else {
            throw PassError.noCredentialsToUpdate
        }
        credentialProvider.setCredential(.init(sessionID: credentials.sessionID,
                                               accessToken: refreshedTokens.accessToken,
                                               refreshToken: refreshedTokens.refreshToken,
                                               userID: credentials.userID))
    }
}
