//
// FetchRelatedOrigins.swift
// Proton Pass - Created on 01/06/2026.
// Copyright (c) 2026 Proton Technologies AG
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

public protocol FetchRelatedOriginsUseCase: Sendable {
    func execute(_ url: String) async throws -> String?
}

public extension FetchRelatedOriginsUseCase {
    func callAsFunction(_ url: String) async throws -> String? {
        try await execute(url)
    }
}

/// Fetches a relying party's `/.well-known/webauthn` related-origins file from the
/// native host. `URLSession` sends no `Sec-Fetch-*`/`Origin` headers, so it is not
/// subject to the WebKit request classification that makes the browser `fetch` fail
/// on RPs running a Fetch-Metadata isolation policy. Scoped to the well-known path.
public final class FetchRelatedOrigins: Sendable, FetchRelatedOriginsUseCase {
    public init() {}

    private struct Response: Encodable {
        var status: Int?
        var finalUrl: String?
        var body: String?
        var error: String?
    }

    public func execute(_ url: String) async throws -> String? {
        guard let url = URL(string: url),
              url.scheme == "https",
              url.path.hasSuffix("/.well-known/webauthn") else {
            return encode(Response(error: "invalid url"))
        }

        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            let http = response as? HTTPURLResponse
            return encode(Response(status: http?.statusCode ?? 0,
                                   finalUrl: http?.url?.absoluteString ?? url.absoluteString,
                                   body: String(data: data, encoding: .utf8) ?? ""))
        } catch {
            return encode(Response(error: error.localizedDescription))
        }
    }

    private func encode(_ payload: Response) -> String? {
        guard let data = try? JSONEncoder().encode(payload) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
