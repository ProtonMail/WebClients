//
// AliasGeneratorViewModel.swift
// Proton Pass - Created on 01/01/2026.
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

import FactoryKit
import Foundation

enum AliasGeneratorState {
    case loading
    case loaded(AliasOptions)
    case error(any Error)

    var aliasOptions: AliasOptions? {
        if case let .loaded(aliasOptions) = self {
            aliasOptions
        } else {
            nil
        }
    }
}

@MainActor
@Observable
final class AliasGeneratorViewModel {
    private(set) var state: AliasGeneratorState = .loading
    var prefix: String
    private(set) var prefixError: AliasPrefixError?
    var selectedSuffix: Suffix?
    var selectedMailboxes: [AliasLinkedMailbox] = []

    @ObservationIgnored
    @LazyInjected(\UseCaseContainer.validateAliasPrefix)
    private var validateAliasPrefix

    init(prefix: String) {
        self.prefix = prefix
    }
}

extension AliasGeneratorViewModel {
    func refresh() async {
        do {
            state = .loading
            let options = try await getAliasOptions()
            selectedSuffix = options.suffixes.first
            selectedMailboxes = Array(options.mailboxes.prefix(1))
            state = .loaded(options)
        } catch {
            state = .error(error)
        }
    }

    func validatePrefix() {
        do {
            try validateAliasPrefix(prefix: prefix)
            prefixError = nil
        } catch {
            prefixError = error
        }
    }
}

private extension AliasGeneratorViewModel {
    @concurrent
    func getAliasOptions() async throws -> AliasOptions {
        try await Task.sleep(for: .seconds(0.5))
        return .mock
    }
}
