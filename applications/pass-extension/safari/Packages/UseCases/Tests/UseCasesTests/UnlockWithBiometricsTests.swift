//
// UnlockWithBiometricsTests.swift
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
import LocalAuthentication
import Models
@testable import UseCases
import XCTest

private final class AuthenticatorMock: BiometricAuthenticator, @unchecked Sendable {
    var error: NativeMessageErrorType?
    var lastReason: String?

    func authenticate(reason: String) async throws {
        lastReason = reason
        if let error { throw error }
    }
}

final class UnlockWithBiometricsTests: XCTestCase {
    private var authenticator: AuthenticatorMock!
    private var sut: UnlockWithBiometrics!

    override func setUp() {
        super.setUp()
        authenticator = AuthenticatorMock()
        sut = UnlockWithBiometrics(authenticator: authenticator)
    }

    override func tearDown() {
        authenticator = nil
        sut = nil
        super.tearDown()
    }

    func testUnlockAnswersEmptyObjectWithReason() async throws {
        let response = try await sut(reason: "unlock the browser extension")

        XCTAssertEqual(response, "{}")
        XCTAssertEqual(authenticator.lastReason, "unlock the browser extension")
    }

    func testUnlockFallsBackToDefaultReason() async throws {
        _ = try await sut(reason: "")

        XCTAssertEqual(authenticator.lastReason, "unlock the browser extension")
    }

    func testUnlockPropagatesAuthenticationError() async {
        authenticator.error = .biometricsCancelled

        do {
            _ = try await sut(reason: "")
            XCTFail("Should fail")
        } catch {
            XCTAssertEqual(error as? NativeMessageErrorType, .biometricsCancelled)
        }
    }

    func testLocalAuthenticationErrorsMapToNativeMessageErrors() {
        XCTAssertEqual(NativeMessageErrorType(LAError.Code.userCancel), .biometricsCancelled)
        XCTAssertEqual(NativeMessageErrorType(LAError.Code.appCancel), .biometricsCancelled)
        XCTAssertEqual(NativeMessageErrorType(LAError.Code.systemCancel), .biometricsCancelled)
        XCTAssertEqual(NativeMessageErrorType(LAError.Code.authenticationFailed), .biometricsFailed)
        XCTAssertEqual(NativeMessageErrorType(LAError.Code.passcodeNotSet), .unknown)
    }
}
