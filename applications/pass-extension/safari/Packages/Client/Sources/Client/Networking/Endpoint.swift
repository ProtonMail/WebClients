//
// Endpoint.swift
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
import ProtonCoreNetworking

/// For endpoints that have no body like GET ones
public struct EmptyRequest: Encodable, Sendable {}

/// Holds responses that only have `code` field
public struct CodeOnlyResponse: Decodable, Sendable {
    public let code: Int
    public var isSuccessful: Bool { code == 1_000 }
}

/// The content of Endpoint should not be changed to anything other than [String:  Any]
/// as the parsing in the `Networking` core lib is very strict on this aspect.
/// You should annotate the endpoint as `@unchecked Sendable` if you have params or queries set on it
public protocol Endpoint: Request, Sendable {
    associatedtype Body: Encodable & Sendable
    associatedtype Response: Decodable & Sendable

    /// The "name" of the endpoint for debugging purposes
    var debugDescription: String { get }
    var body: Body? { get }
    var queries: [String: Any]? { get }
}

public extension Endpoint {
    var isAuth: Bool { true }
    var method: HTTPMethod { .get }
    var body: Body? { nil }
    var nonDefaultTimeout: TimeInterval? { nil }
    var queries: [String: Any]? { nil }
    var parameters: [String: Any]? {
        var finalParams: [String: Any] = [:]

        if let queries {
            finalParams.merge(queries) { _, new in new }
        }

        if let body,
           let data = try? JSONEncoder().encode(body),
           let bodyParams = (try? JSONSerialization.jsonObject(with: data,
                                                               options: .allowFragments)).flatMap({ $0 as? [
               String: Any
           ] }) {
            finalParams.merge(bodyParams) { _, new in new }
        }

        return finalParams.isEmpty ? nil : finalParams
    }
}
