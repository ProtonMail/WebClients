//
// HandleCredentialRequestUseCase.swift
// Proton Pass - Created on 09/04/2026.
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

@preconcurrency import AuthenticationServices

protocol HandleCredentialRequestUseCase: Sendable {
    func callAsFunction(context: ASCredentialProviderExtensionContext,
                        request: any ASCredentialRequest) async throws
}

struct HandleCredentialRequest: HandleCredentialRequestUseCase {
    func callAsFunction(context: ASCredentialProviderExtensionContext,
                        request: any ASCredentialRequest) async throws {
        let credential = try await credential(for: request)
        await context.perform(request: .autoFill(credential))
    }
}

private extension HandleCredentialRequest {
    @concurrent
    func credential(for request: ASCredentialRequest) async throws -> any ASAuthorizationCredential {
        if request is ASPasswordCredentialRequest {
            return ASPasswordCredential(user: "john.doe", password: "password")
        }
        if #available(macOS 15.0, *), request is ASOneTimeCodeCredentialRequest {
            return ASOneTimeCodeCredential(code: "12345")
        }
        throw AutoFillError.unknownCredentialRequest
    }
}
