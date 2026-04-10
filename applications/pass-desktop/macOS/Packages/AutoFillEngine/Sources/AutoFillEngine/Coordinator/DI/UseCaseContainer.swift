//
// UseCaseContainer.swift
// Proton Pass - Created on 30/12/2025.
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
import PassRustCore

final class UseCaseContainer: SharedContainer, AutoRegistering {
    static let shared = UseCaseContainer()
    let manager = ContainerManager()

    func autoRegister() {
        manager.defaultScope = .singleton
    }
}

extension UseCaseContainer {
    var passwordGenerator: Factory<any RandomPasswordGeneratorProtocol> {
        self { RandomPasswordGenerator() }
    }

    var generatePassword: Factory<any GeneratePasswordUseCase> {
        self { GeneratePassword(generator: self.passwordGenerator()) }
    }

    var passphraseGenerator: Factory<any PassphraseGeneratorProtocol> {
        self { PassphraseGenerator() }
    }

    var generateRandomWords: Factory<any GenerateRandomWordsUseCase> {
        self { GenerateRandomWords(generator: self.passphraseGenerator()) }
    }

    var generatePassphrase: Factory<any GeneratePassphraseUseCase> {
        self { GeneratePassphrase(generator: self.passphraseGenerator()) }
    }

    var getPasswordStrength: Factory<any GetPasswordStrengthUseCase> {
        self { GetPasswordStrength() }
    }

    var validateAliasPrefix: Factory<any ValidateAliasPrefixUseCase> {
        self { ValidateAliasPrefix() }
    }

    var handleAutoFillAction: Factory<any HandleAutoFillActionUseCase> {
        self { HandleAutoFillAction() }
    }

    var handleCredentialRequest: Factory<any HandleCredentialRequestUseCase> {
        self { HandleCredentialRequest() }
    }
}
