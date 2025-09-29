//
// GetAccess.swift
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
import ProtonCoreServices

public protocol GetAccessUseCase: Sendable {
    func execute(_ apiService: any APIService) async throws -> Access
}

public extension GetAccessUseCase {
    func callAsFunction(_ apiService: any APIService) async throws -> Access {
        try await execute(apiService)
    }
}

public final class GetAccess: Sendable, GetAccessUseCase {
    public init() {}

    public func execute(_ apiService: any APIService) async throws -> Access {
        let endpoint = GetAccessEndpoint()
        let response = try await apiService.exec(endpoint: endpoint)
        return response.access
    }
}
