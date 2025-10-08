//
// GetUser.swift
// Proton Pass - Created on 27/05/2024.
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
import ProtonCoreServices

public protocol GetUserUseCase: Sendable {
    func execute(_ apiService: any APIService) async throws -> User
}

public extension GetUserUseCase {
    func callAsFunction(_ apiService: any APIService) async throws -> User {
        try await execute(apiService)
    }
}

public final class GetUser: Sendable, GetUserUseCase {
    public init() {}

    public func execute(_ apiService: any APIService) async throws -> User {
        let endpoint = GetUserEndpoint()
        let response = try await apiService.exec(endpoint: endpoint)
        return response.user
    }
}
