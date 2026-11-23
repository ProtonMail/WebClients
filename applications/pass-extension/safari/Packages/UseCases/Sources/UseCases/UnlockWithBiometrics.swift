//
// UnlockWithBiometrics.swift
// Proton Pass - Created on 21/10/2026.
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

import Client
import Foundation

/// The extension trusts this app extension: a successful answer is the whole unlock proof
public protocol UnlockWithBiometricsUseCase: Sendable {
    func execute(reason: String) async throws -> String?
}

public extension UnlockWithBiometricsUseCase {
    func callAsFunction(reason: String) async throws -> String? {
        try await execute(reason: reason)
    }
}

public final class UnlockWithBiometrics: Sendable, UnlockWithBiometricsUseCase {
    /// Fallback for extensions older than the localized `reason` field
    private static let defaultReason = "unlock the browser extension"

    private let authenticator: any BiometricAuthenticator

    public init(authenticator: any BiometricAuthenticator) {
        self.authenticator = authenticator
    }

    public func execute(reason: String) async throws -> String? {
        try await authenticator.authenticate(reason: reason.isEmpty ? Self.defaultReason : reason)
        return "{}"
    }
}
