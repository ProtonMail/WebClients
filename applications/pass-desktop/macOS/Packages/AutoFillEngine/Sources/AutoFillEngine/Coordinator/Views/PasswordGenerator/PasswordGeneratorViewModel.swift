//
// PasswordGeneratorViewModel.swift
// Proton Pass - Created on 29/12/2025.
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
import SwiftUI

@MainActor
@Observable
final class PasswordGeneratorViewModel {
    private(set) var password = ""
    private(set) var strength: PasswordStrength?
    var error: (any Error)?

    @ObservationIgnored
    private var cachedWords: [String] = []

    @ObservationIgnored
    @LazyInjected(\UseCaseContainer.generatePassword)
    private var generatePassword

    @ObservationIgnored
    @LazyInjected(\UseCaseContainer.generateRandomWords)
    private var generateRandomWords

    @ObservationIgnored
    @LazyInjected(\UseCaseContainer.generatePassphrase)
    private var generatePassphrase

    @ObservationIgnored
    @LazyInjected(\UseCaseContainer.getPasswordStrength)
    private var getPasswordStrength
}

extension PasswordGeneratorViewModel {
    func updateStrength() {
        strength = getPasswordStrength(password: password)
    }

    func regeneratePassword(characterCount: Int,
                            specialCharactes: Bool,
                            capitalLetters: Bool,
                            includeNumbers: Bool) {
        do {
            password = try generatePassword(length: characterCount,
                                            numbers: includeNumbers,
                                            uppercaseLetters: capitalLetters,
                                            symbols: specialCharactes)
        } catch {
            self.error = error
        }
    }

    func regeneratePassphrase(wordCount: Int,
                              separator: PassphraseWordSeparator,
                              capitalize: Bool,
                              includeNumbers: Bool,
                              force: Bool) {
        do {
            if force || cachedWords.isEmpty || cachedWords.count != wordCount {
                cachedWords = try generateRandomWords(wordCount: wordCount)
            }

            password = try generatePassphrase(words: cachedWords,
                                              separator: separator,
                                              capitalise: capitalize,
                                              includeNumbers: includeNumbers)
        } catch {
            self.error = error
        }
    }
}
