//
// SafariWebExtensionHandler.swift
// SimpleLogin - Created on 22/05/2024.
// Copyright (c) 2024 Proton Technologies AG
//
// This file is part of SimpleLogin.
//
// SimpleLogin is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// SimpleLogin is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with SimpleLogin. If not, see https://www.gnu.org/licenses/.

import Factory
import os.log
import SafariServices
import Shared

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    private let processSafariExtensionEvent = resolve(\SharedUseCaseContainer.processSafariExtensionEvent)
    private let setEnvironment = resolve(\SharedUseCaseContainer.setEnvironment)
    private let setCredentials = resolve(\SharedUseCaseContainer.setCredentials)
    private let updateCredentials = resolve(\SharedUseCaseContainer.updateCredentials)
    private let createLogger = resolve(\SharedUseCaseContainer.createLogger)

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let message: Any? = if #available(iOS 17.0, macOS 14.0, *) {
            request?.userInfo?[SFExtensionMessageKey]
        } else {
            request?.userInfo?["message"]
        }

        if let message {
            Task { [weak self] in
                await self?.handle(message: String(describing: message))
            }
        }
    }
}

private extension SafariWebExtensionHandler {
    func handle(message: String) async {
        let logger = createLogger(category: "SafariExtension")
        do {
            switch try processSafariExtensionEvent(message) {
            case let .newCredentials(credentials):
                try await setCredentials(credentials)
            case let .updateCredentials(tokens):
                try await updateCredentials(tokens)
            case let .environment(environment):
                try await setEnvironment(environment)
            case .unknown:
                logger.error("Unknown message")
            }
        } catch {
            logger.error("Error handling message \(error.localizedDescription, privacy: .public)")
        }
    }
}
