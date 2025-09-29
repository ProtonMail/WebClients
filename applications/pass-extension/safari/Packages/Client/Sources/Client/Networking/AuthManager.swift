//
// AuthManager.swift
// Proton Pass - Created on 20/11/2023.
// Copyright (c) 2023 Proton Technologies AG
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

import Foundation
import ProtonCoreAuthentication
import ProtonCoreLog
import ProtonCoreNetworking
import ProtonCoreServices
import ProtonCoreUtilities

public protocol AuthManagerProtocol: AuthDelegate {
    func setUpDelegate(_ delegate: any AuthHelperDelegate,
                       callingItOn executor: CompletionBlockExecutor?)
}

public final class AuthManager: AuthManagerProtocol {
    private let credentialProvider: Atomic<any CredentialProvider>

    public private(set) weak var delegate: (any AuthHelperDelegate)?
    // swiftlint:disable:next identifier_name
    public weak var authSessionInvalidatedDelegateForLoginAndSignup: (any AuthSessionInvalidatedDelegate)?
    private var delegateExecutor: CompletionBlockExecutor?

    public init(credentialProvider: any CredentialProvider) {
        self.credentialProvider = .init(credentialProvider)
    }

    public func setUpDelegate(_ delegate: any AuthHelperDelegate,
                              callingItOn executor: CompletionBlockExecutor? = nil) {
        if let executor {
            delegateExecutor = executor
        } else {
            let dispatchQueue = DispatchQueue(label: "me.proton.core.auth-helper.default", qos: .userInitiated)
            delegateExecutor = .asyncExecutor(dispatchQueue: dispatchQueue)
        }
        self.delegate = delegate
    }

    public func credential(sessionUID: String) -> Credential? {
        credentialProvider.transform { credentialProvider in
            guard let authCredential = credentialProvider.getAuthCredential() else {
                return nil
            }
            guard authCredential.sessionID == sessionUID else {
                PMLog.error("Asked for wrong credentials. It's a programmers error and should be investigated")
                return nil
            }
            return Credential(authCredential)
        }
    }

    public func authCredential(sessionUID: String) -> AuthCredential? {
        credentialProvider.transform { credentialProvider in
            guard let authCredential = credentialProvider.getAuthCredential() else {
                return nil
            }
            guard authCredential.sessionID == sessionUID else {
                PMLog.error("Asked for wrong credentials. It's a programmers error and should be investigated")
                return nil
            }
            return authCredential
        }
    }

    public func onUpdate(credential: Credential, sessionUID: String) {
        credentialProvider.mutate { credentialProviderUpdated in
            guard let authCredential = credentialProviderUpdated.getAuthCredential() else {
                credentialProviderUpdated.setAuthCredential(AuthCredential(credential))
                return
            }

            guard authCredential.sessionID == sessionUID else {
                PMLog
                    .error("Asked for updating credentials of a wrong session. It should be investigated")
                return
            }

            // we don't nil out the key and password to avoid loosing this information unintentionaly
            let updatedAuth = authCredential.updatedKeepingKeyAndPasswordDataIntact(credential:
                credential)

            credentialProviderUpdated.setAuthCredential(updatedAuth)

            guard let delegate, let delegateExecutor else { return }
            delegateExecutor.execute {
                delegate.credentialsWereUpdated(authCredential: updatedAuth,
                                                credential: credential,
                                                for: sessionUID)
            }
        }
    }

    public func onSessionObtaining(credential: Credential) {
        credentialProvider.mutate { credentialProvider in
            let sessionUID = credential.UID
            let newCredentials = AuthCredential(credential)

            credentialProvider.setAuthCredential(newCredentials)

            guard let delegate, let delegateExecutor else { return }
            delegateExecutor.execute {
                delegate.credentialsWereUpdated(authCredential: newCredentials,
                                                credential: credential,
                                                for: sessionUID)
            }
        }
    }

    public func onAdditionalCredentialsInfoObtained(sessionUID: String,
                                                    password: String?,
                                                    salt: String?,
                                                    privateKey: String?) {
        credentialProvider.mutate { credentialProvider in
            guard let authCredential = credentialProvider.getAuthCredential() else {
                return
            }
            guard authCredential.sessionID == sessionUID else {
                PMLog
                    .error("Asked for updating credentials of a wrong session. It should be investigated")
                return
            }

            if let password {
                authCredential.update(password: password)
            }
            let saltToUpdate = salt ?? authCredential.passwordKeySalt
            let privateKeyToUpdate = privateKey ?? authCredential.privateKey
            authCredential.update(salt: saltToUpdate, privateKey: privateKeyToUpdate)
            credentialProvider.setAuthCredential(authCredential)

            guard let delegate, let delegateExecutor else { return }
            delegateExecutor.execute {
                delegate.credentialsWereUpdated(authCredential: authCredential,
                                                credential: Credential(authCredential),
                                                for: sessionUID)
            }
        }
    }

    public func onAuthenticatedSessionInvalidated(sessionUID: String) {
        credentialProvider.mutate { credentialProvider in
            guard let authCredential = credentialProvider.getAuthCredential() else {
                return
            }
            guard authCredential.sessionID == sessionUID else {
                PMLog
                    .error("Asked for logout of wrong session. It should be investigated")
                return
            }
            credentialProvider.setCredential(nil)

            delegateExecutor?.execute { [weak self] in
                guard let self else {
                    return
                }
                delegate?.sessionWasInvalidated(for: sessionUID, isAuthenticatedSession: true)
            }
            authSessionInvalidatedDelegateForLoginAndSignup?.sessionWasInvalidated(for: sessionUID,
                                                                                   isAuthenticatedSession: true)
        }
    }

    public func onUnauthenticatedSessionInvalidated(sessionUID: String) {
        credentialProvider.mutate { credentialProvider in
            guard let authCredential = credentialProvider.getAuthCredential() else {
                return
            }
            guard authCredential.sessionID == sessionUID else {
                PMLog
                    .error("Asked for erasing the credentials of a wrong session. It should be investigated")
                return
            }
            credentialProvider.setCredential(nil)

            delegateExecutor?.execute { [weak self] in
                guard let self else {
                    return
                }
                delegate?.sessionWasInvalidated(for: sessionUID, isAuthenticatedSession: false)
            }
            authSessionInvalidatedDelegateForLoginAndSignup?.sessionWasInvalidated(for: sessionUID,
                                                                                   isAuthenticatedSession: false)
        }
    }
}
