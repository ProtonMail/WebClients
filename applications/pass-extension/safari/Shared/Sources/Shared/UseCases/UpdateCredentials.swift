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

import Foundation

public protocol UpdateCredentialsUseCase: Sendable {
    func execute(_ refreshedTokens: RefreshedTokens) async throws
}

public extension UpdateCredentialsUseCase {
    func callAsFunction(_ refreshedTokens: RefreshedTokens) async throws {
        try await execute(refreshedTokens)
    }
}

public final class UpdateCredentials: Sendable, UpdateCredentialsUseCase {
    private let getCredentials: any GetCredentialsUseCase
    private let setCredentials: any SetCredentialsUseCase

    public init(getCredentials: any GetCredentialsUseCase,
                setCredentials: any SetCredentialsUseCase) {
        self.getCredentials = getCredentials
        self.setCredentials = setCredentials
    }

    public func execute(_ refreshedTokens: RefreshedTokens) async throws {
        guard let credentials = try await getCredentials() else {
            throw PassError.noCredentialsToUpdate
        }
        try await setCredentials(.init(sessionID: credentials.sessionID,
                                       accessToken: refreshedTokens.accessToken,
                                       refreshToken: refreshedTokens.refreshToken,
                                       userID: credentials.userID))
    }
}
