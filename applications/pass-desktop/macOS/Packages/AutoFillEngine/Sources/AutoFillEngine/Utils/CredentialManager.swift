//
// CredentialManager.swift
// Proton Pass - Created on 23/09/2025.
// Copyright (c) 2025 Proton Technologies AG
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

@preconcurrency import AuthenticationServices
import os.log

public protocol CredentialManagerProtocol: Sendable {
    var isAutoFillEnabled: Bool { get async }

    func remove(credentials: [CredentialIdentity]) async throws
    func insert(credentials: [CredentialIdentity]) async throws
    func removeAllCredentials() async throws

    @available(iOS 18.0, macOS 15.0, *)
    func enableAutoFill() async -> Bool
}

public final class CredentialManager: CredentialManagerProtocol {
    private let store: ASCredentialIdentityStore
    private let logger: Logger

    public init(store: ASCredentialIdentityStore = .shared) {
        self.store = store
        logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "ProtonPass",
                        category: "CredentialManager")
    }
}

public extension CredentialManager {
    var isAutoFillEnabled: Bool {
        get async {
            await store.state().isEnabled
        }
    }

    func remove(credentials: [CredentialIdentity]) async throws {
        guard !credentials.isEmpty else {
            logger.log("No credentials to remove")
            return
        }
        let count = credentials.count
        logger.log("Trying to remove \(count) credentials")
        let state = await store.state()

        guard state.isEnabled else {
            logger.log("AutoFill not enabled. Skipped removing \(count) credentials")
            return
        }

        if state.supportsIncrementalUpdates {
            logger.log("Non empty credential store. Removing \(count) credentials")
            try await store.perform(.remove, on: credentials)
            logger.log("Removed \(count) credentials")
        } else {
            logger.log("Empty credential store. Nothing to remove.")
        }
    }

    func insert(credentials: [CredentialIdentity]) async throws {
        guard !credentials.isEmpty else {
            logger.log("No credentials to insert")
            return
        }
        let count = credentials.count
        logger.log("Trying to insert \(count) credentials")
        let state = await store.state()

        guard state.isEnabled else {
            logger.log("AutoFill not enabled. Skipped inserting \(count) credentials")
            return
        }

        if state.supportsIncrementalUpdates {
            logger.log("Non empty credential store. Inserting \(count) credentials")
            try await store.perform(.save, on: credentials)
        } else {
            logger.log("Empty credential store. Inserting \(count) credentials")
            try await store.perform(.replace, on: credentials)
        }
        logger.log("Inserted \(count) credentials")
    }

    func removeAllCredentials() async throws {
        logger.log("Removing all credentials")
        guard await isAutoFillEnabled else {
            logger.log("AutoFill not enabled. Skipped removing all credentials.")
            return
        }
        try await store.removeAllCredentialIdentities()
        logger.log("Removed all credentials")
    }

    @available(iOS 18.0, macOS 15.0, *)
    func enableAutoFill() async -> Bool {
        await ASSettingsHelper.requestToTurnOnCredentialProviderExtension()
    }
}
