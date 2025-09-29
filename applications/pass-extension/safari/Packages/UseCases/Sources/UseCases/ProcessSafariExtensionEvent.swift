//
// ProcessSafariExtensionEvent.swift
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

import Foundation
import Models
@preconcurrency import OSLog

public protocol ProcessSafariExtensionEventUseCase: Sendable {
    func execute(_ json: String) throws -> SafariExtensionEvent
}

public extension ProcessSafariExtensionEventUseCase {
    func callAsFunction(_ json: String) throws -> SafariExtensionEvent {
        try execute(json)
    }
}

public final class ProcessSafariExtensionEvent: ProcessSafariExtensionEventUseCase {
    private let logger: Logger

    public init(createLogger: any CreateLoggerUseCase) {
        logger = createLogger(category: String(describing: Self.self))
    }

    // swiftlint:disable:next cyclomatic_complexity
    public func execute(_ json: String) throws -> SafariExtensionEvent {
        guard let data = json.data(using: .utf8) else {
            throw PassError.notUtf8Data
        }

        guard let dict = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
            throw PassError.badJsonFormat(json)
        }

        if let environmentValue = dict["environment"] as? String {
            let environment = parseEnvironment(environmentValue)
            return .environment(environment)
        } else if dict["credentials"] != nil {
            guard let credentialsValue = dict["credentials"] as? [String: Any] else {
                return .newCredentials(nil)
            }

            if let sessionID = credentialsValue["UID"] as? String,
               let accessToken = credentialsValue["AccessToken"] as? String,
               let refreshToken = credentialsValue["RefreshToken"] as? String,
               let userID = credentialsValue["UserID"] as? String {
                return .newCredentials(.init(sessionID: sessionID,
                                             accessToken: accessToken,
                                             refreshToken: refreshToken,
                                             userID: userID))
            }

            throw PassError.failedToParseCredentials
        } else if let refreshedTokens = dict["refreshCredentials"] as? [String: String] {
            if let accessToken = refreshedTokens["AccessToken"],
               let refreshToken = refreshedTokens["RefreshToken"] {
                return .updateCredentials(.init(accessToken: accessToken,
                                                refreshToken: refreshToken))
            }
        } else if dict["readFromClipboard"] is [String: String] {
            return .readFromClipboard
        } else if let writeToClipboard = dict["writeToClipboard"] as? [String: String] {
            if let content = writeToClipboard["Content"] {
                return .writeToClipboard(content: content)
            }
        }

        return .unknown
    }
}

private extension ProcessSafariExtensionEvent {
    func parseEnvironment(_ environment: String) -> PassEnvironment {
        switch environment {
        case "proton.me":
            return .prod
        case "proton.black":
            return .black
        default:
            if let scientistName = environment.components(separatedBy: ".").first {
                return .scientist(scientistName)
            }
            return .prod
        }
    }
}
