//
// PasswordGenerator.swift
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

import DesignSystem
import SwiftUI

struct PasswordGenerator: View {
    @Environment(\.dismiss) private var dismiss
    @State private var maxPasswordHeight: CGFloat = 40

    @AppStorage(.passwordType)
    private var type: PasswordType = .memorable

    @AppStorage(.passwordNumberOfCharacters)
    private var passwordNumberOfCharacters: Double = 20

    @AppStorage(.passwordSpecialCharacters)
    private var passwordSpecialCharacters = true

    @AppStorage(.passwordCapitalLetters)
    private var passwordCapitalLetters = true

    @AppStorage(.passwordIncludeNumbers)
    private var passwordIncludeNumbers = true

    @AppStorage(.passphraseNumberOfWords)
    private var passphraseNumberOfWords: Double = 5

    @AppStorage(.passphraseWordSeparator)
    private var passphraseWordSeparator: PassphraseWordSeparator = .hyphens

    @AppStorage(.passphraseCapitalize)
    private var passphraseCapitalize = true

    @AppStorage(.passphraseIncludeNumbers)
    private var passphraseIncludeNumbers = true

    @State private var viewModel = PasswordGeneratorViewModel()
    var onFill: (String) -> Void

    var body: some View {
        VStack {
            // If we apply top padding to the below Text, it will crash. WTF SwiftUI?
            Spacer()
                .frame(height: 8)

            Text(viewModel.password.coloredPassword())
                .font(.title.monospacedDigit())
                .multilineTextAlignment(.center)
                .textSelection(.enabled)
                .frame(minHeight: maxPasswordHeight)
                .padding(.horizontal)
                .onGeometryChange(for: Double.self,
                                  of: { $0.size.height },
                                  action: { maxPasswordHeight = max(maxPasswordHeight, $0) })

            if let strength = viewModel.strength {
                Label(strength.title, systemImage: strength.imageName)
                    .font(.headline.bold())
                    .foregroundStyle(strength.color)
            }

            TabView(selection: $type) {
                memorable
                    .tabItem { Text("Memorable", bundle: .module) }
                    .tag(PasswordType.memorable)

                random
                    .tabItem { Text("Random", bundle: .module) }
                    .tag(PasswordType.random)
            }
            .padding()

            Divider()

            HStack {
                Spacer()
                Button(action: { regenerate(force: true) },
                       label: {
                           GeneratePasswordImage()
                               .help("Generate another password")
                       })
                Button(action: { onFill(viewModel.password); dismiss() },
                       label: { Text("Fill password", bundle: .module) })
                    .buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .frame(width: 400)
        .task {
            regenerate(force: true)
        }
        .onChange(of: viewModel.password) {
            viewModel.updateStrength()
        }
        .onChange(of: type) { _, _ in
            regenerate(force: false)
        }
        .onChange(of: passwordNumberOfCharacters) {
            regeneratePassword()
        }
        .onChange(of: [passwordSpecialCharacters,
                       passwordCapitalLetters,
                       passwordIncludeNumbers]) {
            regeneratePassword()
        }
        .onChange(of: passphraseNumberOfWords) {
            regeneratePassphrase(force: true)
        }
        .onChange(of: passphraseWordSeparator) {
            regeneratePassphrase(force: false)
        }
        .onChange(of: [passphraseCapitalize, passphraseIncludeNumbers]) {
            regeneratePassphrase(force: false)
        }
    }
}

private extension PasswordGenerator {
    var memorable: some View {
        VStack {
            Slider(value: $passphraseNumberOfWords,
                   in: 1...10,
                   label: { Text("\(Int(passphraseNumberOfWords)) words", bundle: .module) })

            Picker(selection: $passphraseWordSeparator,
                   content: {
                       ForEach(PassphraseWordSeparator.allCases, id: \.self) { separator in
                           Text(separator.title, bundle: .module)
                               .tag(separator)
                               .fixedSize(horizontal: true, vertical: true)
                       }
                   },
                   label: {
                       Text("Word separator", bundle: .module)
                   })
                   .frame(maxWidth: .infinity, alignment: .leading)
            toggle(title: "Capitalize", isOn: $passphraseCapitalize)
            toggle(title: "Include numbers", isOn: $passphraseIncludeNumbers)
        }
        .padding()
    }

    var random: some View {
        VStack {
            Slider(value: $passwordNumberOfCharacters,
                   in: 4...64,
                   label: { Text("\(Int(passwordNumberOfCharacters)) characters", bundle: .module) })

            toggle(title: "Special characters", isOn: $passwordSpecialCharacters)
            toggle(title: "Capital letters", isOn: $passwordCapitalLetters)
            toggle(title: "Include numbers", isOn: $passwordIncludeNumbers)
        }
        .padding()
    }

    func toggle(title: LocalizedStringKey, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            Text(title, bundle: .module)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .toggleStyle(.switch)
    }

    func regenerate(force: Bool) {
        switch type {
        case .random: regeneratePassword()
        case .memorable: regeneratePassphrase(force: force)
        }
    }

    func regeneratePassword() {
        viewModel.regeneratePassword(characterCount: Int(passwordNumberOfCharacters),
                                     specialCharactes: passwordSpecialCharacters,
                                     capitalLetters: passwordCapitalLetters,
                                     includeNumbers: passwordIncludeNumbers)
    }

    func regeneratePassphrase(force: Bool) {
        viewModel.regeneratePassphrase(wordCount: Int(passphraseNumberOfWords),
                                       separator: passphraseWordSeparator,
                                       capitalize: passphraseCapitalize,
                                       includeNumbers: passphraseIncludeNumbers,
                                       force: force)
    }
}

private extension PassphraseWordSeparator {
    var title: LocalizedStringKey {
        switch self {
        case .numbersAndSymbols:
            "Numbers and Symbols"

        case .numbers:
            "Numbers"

        case .underscores:
            "Underscores"

        case .commas:
            "Commas"

        case .periods:
            "Periods"

        case .spaces:
            "Spaces"

        case .hyphens:
            "Hyphens"
        }
    }
}

private extension String {
    func coloredPassword() -> AttributedString {
        let attributedChars = map { char in
            var attributedChar = AttributedString("\(char)", attributes: .lineBreakHyphenErasing)
            attributedChar.foregroundColor = if "0123456789".contains(char) {
                PassColor.loginInteractionNormMajor2
            } else if "!#$%&()*+.:;<=>?@[]^-.,_".contains(char) {
                PassColor.aliasInteractionNormMajor2
            } else {
                PassColor.textNorm
            }
            return attributedChar
        }
        return attributedChars.reduce(into: .init()) { $0 += $1 }
    }
}
