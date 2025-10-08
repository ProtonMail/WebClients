//
// MainViewModel.swift
// Proton Pass - Created on 21/05/2024.
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

import Factory
import Foundation
import Models

enum MainViewModelState {
    case loading
    case loggedIn(PassEnvironment, Credentials)
    case loggedOut
    case error(Error)
}

@MainActor
final class MainViewModel: ObservableObject {
    @Published private(set) var state: MainViewModelState = .loading

    private let getEnvironment = resolve(\SharedUseCaseContainer.getEnvironment)
    private let credentialProvider = resolve(\SharedUseCaseContainer.credentialProvider)
    private let resetDataIfFirstRun = resolve(\SharedUseCaseContainer.resetDataIfFirstRun)

    init() {}
}

extension MainViewModel {
    func refreshState() async {
        do {
            if case .error = state {
                state = .loading
            }
            try await resetDataIfFirstRun()
            let environment = try await getEnvironment()
            if let credentials = credentialProvider.getCredentials() {
                state = .loggedIn(environment, credentials)
            } else {
                state = .loggedOut
            }
        } catch {
            state = .error(error)
        }
    }

    func handleLogOut() {
        state = .loggedOut
    }
}

extension MainViewModelState: Equatable {
    static func == (lhs: Self, rhs: Self) -> Bool {
        switch (lhs, rhs) {
        case (.loading, .loading), (.loggedOut, .loggedOut):
            true
        case let (.loggedIn(lEnv, lCreds), .loggedIn(rEnv, rCreds)):
            lEnv == rEnv && lCreds == rCreds
        case let (.error(lError), .error(rError)):
            lError.localizedDescription == rError.localizedDescription
        default:
            false
        }
    }
}
