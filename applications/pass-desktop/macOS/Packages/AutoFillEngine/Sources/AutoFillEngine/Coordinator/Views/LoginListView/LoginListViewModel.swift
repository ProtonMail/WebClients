//
// LoginListViewModel.swift
// Proton Pass - Created on 25/09/2025.
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

import FactoryKit
import Foundation
import SwiftUI

struct LoginCollection: Equatable {
    let matched: [LoginUiModel]
    let notMatched: [LoginUiModel]

    func getLogin(id: String) -> LoginUiModel? {
        matched.first(where: { $0.id == id }) ?? notMatched.first(where: { $0.id == id })
    }

    func sorted(using comparator: any SortComparator<LoginUiModel>) -> Self {
        .init(matched: matched.sorted(using: comparator),
              notMatched: notMatched.sorted(using: comparator))
    }
}

enum LoginListViewState: Equatable {
    case loading
    case loaded
    case error(String)

    var isError: Bool {
        if case .error = self {
            true
        } else {
            false
        }
    }

    var isLoaded: Bool {
        if case .loaded = self {
            true
        } else {
            false
        }
    }
}

@MainActor
@Observable
final class LoginListViewModel {
    private(set) var state: LoginListViewState = .loading
    private(set) var isSorting = false

    private var allLogins: [LoginUiModel] = []
    private(set) var collection = LoginCollection(matched: [], notMatched: [])

    @ObservationIgnored
    @LazyInjected(\ContextContainer.serviceIdentifiers)
    private var serviceIdentifiers

    @ObservationIgnored
    @LazyInjected(\ContextContainer.passkeyCredentialRequestParams)
    private var passkeyCredentialRequestParams

    @ObservationIgnored
    @AppStorage(.sortOption)
    private var sortOption = SortOption.default

    var url: String? {
        let identifier = serviceIdentifiers.first?.identifier
        if let identifier,
           let url = URL(string: identifier),
           let scheme = url.scheme,
           let host = url.host() {
            return "\(scheme)://\(host)\(url.path())"
        }
        return identifier
    }

    init() {}
}

extension LoginListViewModel {
    func loadLogins() async {
        guard allLogins.isEmpty || state.isError else { return }
        do {
            if state.isError {
                state = .loading
            }
            allLogins = try await getAllLogins()
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    func filterLogins(searchTerm: String) {
        var matched = [LoginUiModel]()
        var notMatched = [LoginUiModel]()

        for login in allLogins where login.match(searchTerm) {
            if login.matched {
                matched.append(login)
            } else {
                notMatched.append(login)
            }
        }
        collection = .init(matched: matched, notMatched: notMatched)
    }

    func sort(using comparator: any SortComparator<LoginUiModel>) {
        defer { isSorting = false }
        isSorting = true
        collection = collection.sorted(using: comparator)
        saveSortOption(comparator)
        isSorting = false
    }
}

private extension LoginListViewModel {
    @concurrent
    func getAllLogins() async throws -> [LoginUiModel] {
        try await Task.sleep(for: .seconds(0.5))
        return .mock
    }

    func saveSortOption(_ comparator: any SortComparator<LoginUiModel>) {
        guard let keyPathComparator = comparator as? KeyPathComparator<LoginUiModel> else { return }
        let isForward = comparator.order == .forward
        let keyPath = keyPathComparator.keyPath
        if keyPath == \LoginUiModel.title {
            sortOption = isForward ? .titleForward : .titleReverse
        } else if keyPath == \LoginUiModel.sortableLastAutofilledDate {
            sortOption = isForward ? .lastAutofilledForward : .lastAutofilledReverse
        } else if keyPath == \LoginUiModel.modificationDate {
            sortOption = isForward ? .modificationForward : .modificationReverse
        } else if keyPath == \LoginUiModel.creationDate {
            sortOption = isForward ? .creationForward : .creationReverse
        }
    }
}

private extension SortOption {
    var keyPathComparator: KeyPathComparator<LoginUiModel> {
        switch self {
        case .titleForward: KeyPathComparator(\.title, order: .forward)
        case .titleReverse: KeyPathComparator(\.title, order: .reverse)
        case .lastAutofilledForward: KeyPathComparator(\.sortableLastAutofilledDate, order: .forward)
        case .lastAutofilledReverse: KeyPathComparator(\.sortableLastAutofilledDate, order: .reverse)
        case .modificationForward: KeyPathComparator(\.modificationDate, order: .forward)
        case .modificationReverse: KeyPathComparator(\.modificationDate, order: .reverse)
        case .creationForward: KeyPathComparator(\.creationDate, order: .forward)
        case .creationReverse: KeyPathComparator(\.creationDate, order: .reverse)
        }
    }
}
