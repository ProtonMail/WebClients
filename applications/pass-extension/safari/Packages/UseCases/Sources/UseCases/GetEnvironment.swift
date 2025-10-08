//
// GetEnvironment.swift
// Proton Pass - Created on 20/05/2024.
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

public protocol GetEnvironmentUseCase: Sendable {
    func execute() async throws -> PassEnvironment
}

public extension GetEnvironmentUseCase {
    func callAsFunction() async throws -> PassEnvironment {
        try await execute()
    }
}

public final class GetEnvironment: Sendable, GetEnvironmentUseCase {
    private let keychain: any KeychainProvider

    public init(keychain: any KeychainProvider) {
        self.keychain = keychain
    }

    public func execute() async throws -> PassEnvironment {
        guard let data = try await keychain.getData(for: Constants.environmentKey) else {
            return .prod
        }
        return try JSONDecoder().decode(PassEnvironment.self, from: data)
    }
}
