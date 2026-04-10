//
// HandleAutoFillActionUseCase.swift
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

protocol HandleAutoFillActionUseCase: Sendable {
    func callAsFunction(context: ASCredentialProviderExtensionContext,
                        action: AutoFillAction) async throws
}

struct HandleAutoFillAction: HandleAutoFillActionUseCase {
    func callAsFunction(context: ASCredentialProviderExtensionContext,
                        action: AutoFillAction) async throws {
        switch action {
        case .cancel:
            context.cancel(reason: .userCanceled)

        case let .associateAndAutofillPassword(login),
             let .autofillPassword(login):
            let credential = try await credential(for: login)
            await context.perform(request: .autoFill(credential))
        }
    }
}

private extension HandleAutoFillAction {
    @concurrent
    func credential(for login: LoginUiModel) async throws -> ASPasswordCredential {
        try await Task.sleep(for: .seconds(1))
        return .init(user: login.emailOrUsername, password: "12345")
    }
}
