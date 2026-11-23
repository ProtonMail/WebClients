//
// BiometricAuthenticator.swift
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

import Foundation
import LocalAuthentication
import Models

/// Touch ID, falling back to the macOS password
public protocol BiometricAuthenticator: Sendable {
    func authenticate(reason: String) async throws
}

public final class BiometricAuthenticatorImpl: BiometricAuthenticator {
    public init() {}

    public func authenticate(reason: String) async throws {
        do {
            _ = try await LAContext().evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason)
        } catch let error as LAError {
            throw NativeMessageErrorType(error.code)
        } catch {
            throw NativeMessageErrorType.unknown
        }
    }
}

public extension NativeMessageErrorType {
    init(_ code: LAError.Code) {
        switch code {
        case .userCancel, .appCancel, .systemCancel:
            self = .biometricsCancelled
        case .authenticationFailed:
            self = .biometricsFailed
        default:
            self = .unknown
        }
    }
}
