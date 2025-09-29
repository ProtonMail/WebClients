//
// ProcessSafariExtensionEventTests.swift
// Proton Pass - Created on 20/05/2024.
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

@testable import Shared
import XCTest

final class ProcessSafariExtensionEventTests: XCTestCase {
    var sut: ProcessSafariExtensionEventUseCase!

    override func setUp() {
        super.setUp()
        sut = ProcessSafariExtensionEvent(createLogger: CreateLogger())
    }

    override func tearDown() {
        sut = nil
        super.tearDown()
    }
}

extension ProcessSafariExtensionEventTests {
    func testParseEnvironmentEvent() throws {
        let result1 = try sut.execute("{\"environment\":\"proton.me\"}")
        XCTAssertEqual(result1, .environment(.prod))

        let result2 = try sut.execute("{\"environment\":\"proton.black\"}")
        XCTAssertEqual(result2, .environment(.black))

        let result3 = try sut.execute("{\"environment\":\"anderson.proton.black\"}")
        XCTAssertEqual(result3, .environment(.scientist("anderson")))
    }

    func testParseNewCredentialsEvent() throws {
        let result1 = try sut.execute("{\"credentials\":null}")
        XCTAssertEqual(result1, .newCredentials(nil))

        let json = """
        {
            "credentials": {
                "UID": "test_sessionid",
                "AccessToken": "test_access_token",
                "RefreshToken": "test_refresh_token",
                "DisplayName": "test_display_name",
                "Email": "test_email",
                "UserID": "test_userid"
            }
        }
        """
        let result2 = try sut.execute(json)
        let credentials = Credentials(sessionID: "test_sessionid",
                                      accessToken: "test_access_token",
                                      refreshToken: "test_refresh_token",
                                      userID: "test_userid")
        XCTAssertEqual(result2, .newCredentials(credentials))
    }

    func testParseUpdateCredentialsEvent() throws {
        let json = """
        {
            "refreshCredentials": {
                "AccessToken": "test_access_token",
                "RefreshToken": "test_refresh_token"
            }
        }
        """
        let result = try sut.execute(json)
        let tokens = RefreshedTokens(accessToken: "test_access_token",
                                     refreshToken: "test_refresh_token")
        XCTAssertEqual(result, .updateCredentials(tokens))
    }

    func testParseReadFromClipboardEvent() throws {
        let json = """
        {
            "readFromClipboard": {}
        }
        """
        let result = try sut.execute(json)
        XCTAssertEqual(result, .readFromClipboard)
    }

    func testParseWriteToClipboardEvent() throws {
        let json = """
        {
            "writeToClipboard": {
                "Content": "test_content"
            }
        }
        """
        let result = try sut.execute(json)
        XCTAssertEqual(result, .writeToClipboard(content: "test_content"))
    }

    func testThrowErrorsWhenInvalidJson() {
        let expectation1 = XCTestExpectation(description: "Should fail")
        let expectation2 = XCTestExpectation(description: "Should fail")

        do {
            _ = try sut.execute("")
        } catch {
            expectation1.fulfill()
        }

        do {
            _ = try sut.execute("invalid ")
        } catch {
            expectation2.fulfill()
        }

        wait(for: [expectation1, expectation2])
    }

    func testParseUnknownEvent() throws {
        let result1 = try sut.execute("{\"random_key\":null}")
        XCTAssertEqual(result1, .unknown)

        let result2 = try sut.execute("{\"random_key\":1}")
        XCTAssertEqual(result2, .unknown)
    }
}
