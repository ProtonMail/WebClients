//
// SharedUseCaseContainer.swift
// Proton Pass - Created on 19/05/2024.
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

import Client
import Factory
import Foundation
import UseCases

final class SharedUseCaseContainer: SharedContainer, AutoRegistering {
    static let shared = SharedUseCaseContainer()
    let manager = ContainerManager()

    func autoRegister() {
        manager.defaultScope = .shared
    }
}

private extension SharedUseCaseContainer {
    var keychain: any KeychainProvider {
        SharedToolingContainer.shared.keychain()
    }
}

extension SharedUseCaseContainer {
    var setCoreLoggerEnvironment: Factory<any SetCoreLoggerEnvironmentUseCase> {
        self { SetCoreLoggerEnvironment() }
    }

    var getEnvironment: Factory<any GetEnvironmentUseCase> {
        self { GetEnvironment(keychain: self.keychain) }
    }

    var setEnvironment: Factory<any SetEnvironmentUseCase> {
        self { SetEnvironment(keychain: self.keychain) }
    }

    var updateCredentials: Factory<any UpdateCredentialsUseCase> {
        self { UpdateCredentials(credentialProvider: self.credentialProvider()) }
    }

    var readFromClipboard: Factory<any ReadFromClipboardUseCase> {
        self { ReadFromClipboard() }
    }

    var writeToClipboard: Factory<any WriteToClipboardUseCase> {
        self { WriteToClipboard() }
    }

    var resetDataIfFirstRun: Factory<any ResetDataIfFirstRunUseCase> {
        self { ResetDataIfFirstRun(setEnvironment: self.setEnvironment(),
                                   credentialProvider: self.credentialProvider()) }
    }

    var createLogger: Factory<any CreateLoggerUseCase> {
        self { CreateLogger() }
    }

    var processSafariExtensionEvent: Factory<any ProcessSafariExtensionEventUseCase> {
        self { ProcessSafariExtensionEvent(createLogger: self.createLogger()) }
    }

    var credentialProvider: Factory<any CredentialProvider> {
        self { CredentialProviderImpl(keychain: self.keychain) }
    }

    var createApiManager: Factory<any CreateApiManagerUseCase> {
        self { CreateApiManager(appVersion: SharedToolingContainer.shared.appVersion(),
                                credentialProvider: self.credentialProvider()) }
    }

    var getAccess: Factory<any GetAccessUseCase> {
        self { GetAccess() }
    }

    var getUser: Factory<any GetUserUseCase> {
        self { GetUser() }
    }
}
