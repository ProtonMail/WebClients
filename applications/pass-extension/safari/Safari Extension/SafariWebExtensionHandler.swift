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

import Client
import Factory
import os.log
import SafariServices

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    private let processSafariExtensionEvent = resolve(\SharedUseCaseContainer.processSafariExtensionEvent)
    private let setEnvironment = resolve(\SharedUseCaseContainer.setEnvironment)
    private let credentialProvider = resolve(\SharedUseCaseContainer.credentialProvider)
    private let updateCredentials = resolve(\SharedUseCaseContainer.updateCredentials)
    private let readFromClipboard = resolve(\SharedUseCaseContainer.readFromClipboard)
    private let writeToClipboard = resolve(\SharedUseCaseContainer.writeToClipboard)
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
                if let result = await self?.handle(message: String(describing: message)) {
                    let response = NSExtensionItem()
                    response.userInfo = [SFExtensionMessageKey: result]
                    context.completeRequest(returningItems: [response], completionHandler: nil)
                }
            }
        }
    }
}

private extension SafariWebExtensionHandler {
    func handle(message: String) async -> String? {
        let logger = createLogger(category: "SafariExtension")
        do {
            switch try processSafariExtensionEvent(message) {
            case let .newCredentials(credentials):
                credentialProvider.setCredential(credentials)
            case let .updateCredentials(tokens):
                try updateCredentials(tokens)
            case let .environment(environment):
                try await setEnvironment(environment)
            case .readFromClipboard:
                return try await readFromClipboard()
            case let .writeToClipboard(content):
                try await writeToClipboard(content)
            case .unknown:
                logger.error("Unknown message")
            }
        } catch {
            logger.error("Error handling message \(error.localizedDescription, privacy: .public)")
        }
        return nil
    }
}
