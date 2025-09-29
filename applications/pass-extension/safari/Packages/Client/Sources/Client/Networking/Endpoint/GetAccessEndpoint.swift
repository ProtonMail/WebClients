//
// GetAccessEndpoint.swift
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

import Models
@preconcurrency import ProtonCoreNetworking

public struct GetAccessResponse: Decodable, Equatable, Sendable {
    public let access: Access
}

public struct GetAccessEndpoint: Endpoint {
    public typealias Body = EmptyRequest
    public typealias Response = GetAccessResponse

    public let debugDescription = "Get Pass access"
    public let path = "/pass/v1/user/access"
    public let method: HTTPMethod = .get

    public init() {}
}
