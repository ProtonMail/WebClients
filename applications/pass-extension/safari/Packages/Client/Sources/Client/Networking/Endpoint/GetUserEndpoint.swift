//
// GetUserEndpoint.swift
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

import Models
@preconcurrency import ProtonCoreNetworking

public struct GetUserResponse: Decodable, Equatable, Sendable {
    public let user: User
}

public struct GetUserEndpoint: Endpoint {
    public typealias Body = EmptyRequest
    public typealias Response = GetUserResponse

    public let debugDescription = "Get user"
    public let path = "/core/v4/users"
    public let method: HTTPMethod = .get

    public init() {}
}
