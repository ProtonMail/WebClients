//
// ApiManager.swift
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

import Foundation
import ProtonCoreAuthentication
import ProtonCoreChallenge
import ProtonCoreDoh
import ProtonCoreEnvironment
import ProtonCoreForceUpgrade
import ProtonCoreFoundations
import ProtonCoreHumanVerification
import ProtonCoreNetworking
import ProtonCoreObservability
import ProtonCoreServices

public final class ApiManager {
    private let trustKitDelegate: any TrustKitDelegate
    private var forceUpgradeHelper: ForceUpgradeHelper?
    private var humanHelper: HumanCheckHelper?

    public let authHelper: any AuthManagerProtocol
    public let apiService: any APIService

    public var appVersion: String
    public var userAgent: String? { UserAgent.default.ua }
    public var locale: String { Locale.autoupdatingCurrent.identifier }
    public var additionalHeaders: [String: String]? { nil }

    private let setCredentials: any SetCredentialsUseCase

    public init(appVersion: String,
                doh: any DoHInterface,
                credentials: Credentials,
                credentialProvider: any CredentialProvider,
                setCredentials: any SetCredentialsUseCase) {
        let trustKitDelegate = PassTrustKitDelegate()
        Self.setUpCertificatePinning(trustKitDelegate: trustKitDelegate)
        self.trustKitDelegate = trustKitDelegate

        authHelper = AuthManager(credentialProvider: credentialProvider)

        let challengeProvider = ChallengeParametersProvider.forAPIService(clientApp: .pass,
                                                                          challenge: .init())
        let apiService = PMAPIService.createAPIService(doh: doh,
                                                       sessionUID: credentials.sessionID,
                                                       challengeParametersProvider: challengeProvider)
        self.appVersion = appVersion
        self.apiService = apiService
        self.setCredentials = setCredentials
        authHelper.setUpDelegate(self, callingItOn: .immediateExecutor)

        if let appStoreUrl = URL(string: Constants.appStoreUrl) {
            forceUpgradeHelper = .init(config: .mobile(appStoreUrl), responseDelegate: self)
        } else {
            assertionFailure("Can not parse App Store URL")
            forceUpgradeHelper = .init(config: .desktop, responseDelegate: self)
        }

        humanHelper = HumanCheckHelper(apiService: apiService,
                                       inAppTheme: { .dark },
                                       clientApp: .pass)
        apiService.humanDelegate = humanHelper
        apiService.authDelegate = authHelper
        apiService.serviceDelegate = self

        ObservabilityEnv.current.setupWorld(requestPerformer: apiService)
    }
}

// MARK: - AuthHelperDelegate

extension ApiManager: AuthHelperDelegate {
    public func sessionWasInvalidated(for sessionUID: String,
                                      isAuthenticatedSession: Bool) {
        Task { [weak self] in
            guard let self else { return }
            try? await setCredentials(nil)
        }
    }

    public func credentialsWereUpdated(authCredential: AuthCredential,
                                       credential: Credential,
                                       for sessionUID: String) {
        Task { [weak self] in
            guard let self else { return }
            try? await setCredentials(.init(sessionID: authCredential.sessionID,
                                            accessToken: authCredential.accessToken,
                                            refreshToken: authCredential.refreshToken,
                                            userID: authCredential.userID))
        }
    }
}

// MARK: - APIServiceDelegate

extension ApiManager: APIServiceDelegate {
    public func onDohTroubleshot() {}

    public func onUpdate(serverTime: Int64) {}

    public func isReachable() -> Bool {
        true
    }
}

// MARK: - ForceUpgradeResponseDelegate

extension ApiManager: ForceUpgradeResponseDelegate {
    public func onQuitButtonPressed() {
        printIfDebug("Quit force upgrade page")
    }

    public func onUpdateButtonPressed() {
        printIfDebug("Forced upgrade")
    }
}

private extension ApiManager {
    static func setUpCertificatePinning(trustKitDelegate: any TrustKitDelegate) {
        TrustKitWrapper.setUp(delegate: trustKitDelegate)
        let trustKit = TrustKitWrapper.current
        PMAPIService.trustKit = trustKit
        PMAPIService.noTrustKit = trustKit == nil
    }

    func printIfDebug(_ message: String) {
        #if DEBUG
        print(message)
        #endif
    }
}

// MARK: - TrustKitDelegate

private class PassTrustKitDelegate: TrustKitDelegate {
    init() {}

    func onTrustKitValidationError(_ error: TrustKitError) {
        #if DEBUG
        switch error {
        case .failed:
            print("Trust kit validation failed")
        case .hardfailed:
            print("Trust kit validation failed with hardfail")
        }
        #endif
    }
}
