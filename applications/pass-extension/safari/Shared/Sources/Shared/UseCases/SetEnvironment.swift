//
// SetEnvironment.swift
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

import Foundation

public protocol SetEnvironmentUseCase: Sendable {
    func execute(_ environment: PassEnvironment) async throws
}

public extension SetEnvironmentUseCase {
    func callAsFunction(_ environment: PassEnvironment) async throws {
        try await execute(environment)
    }
}

public final class SetEnvironment: Sendable, SetEnvironmentUseCase {
    private let keychain: any KeychainProvider

    public init(keychain: any KeychainProvider) {
        self.keychain = keychain
    }

    public func execute(_ environment: PassEnvironment) async throws {
        let data = try JSONEncoder().encode(environment)
        try await keychain.setData(data, for: Constants.environmentKey)
    }
}
