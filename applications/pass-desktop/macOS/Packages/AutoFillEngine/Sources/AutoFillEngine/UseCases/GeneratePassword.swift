//
// GeneratePassword.swift
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
//

import PassRustCore

protocol GeneratePasswordUseCase: Sendable {
    func execute(length: Int,
                 numbers: Bool,
                 uppercaseLetters: Bool,
                 symbols: Bool) throws -> String
}

extension GeneratePasswordUseCase {
    func callAsFunction(length: Int,
                        numbers: Bool,
                        uppercaseLetters: Bool,
                        symbols: Bool) throws -> String {
        try execute(length: length,
                    numbers: numbers,
                    uppercaseLetters: uppercaseLetters,
                    symbols: symbols)
    }
}

final class GeneratePassword: GeneratePasswordUseCase {
    private let generator: any RandomPasswordGeneratorProtocol

    init(generator: any RandomPasswordGeneratorProtocol) {
        self.generator = generator
    }

    func execute(length: Int,
                 numbers: Bool,
                 uppercaseLetters: Bool,
                 symbols: Bool) throws -> String {
        let config = RandomPasswordConfig(length: UInt32(length),
                                          numbers: numbers,
                                          uppercaseLetters: uppercaseLetters,
                                          symbols: symbols)
        return try generator.generate(config: config)
    }
}
