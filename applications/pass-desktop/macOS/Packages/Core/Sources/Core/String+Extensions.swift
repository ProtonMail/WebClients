//
// String+Extensions.swift
// Proton Pass - Created on 23/12/2025.
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

import Foundation

public extension String {
    /// All capitalized. Maximum 2 characters.
    func initials() -> String {
        let first2Words = trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: " ")
            .prefix(2)

        if first2Words.count == 2,
           let firstFirstChar = first2Words.first?.first,
           let secondChar = first2Words.last?.first {
            return String([firstFirstChar, secondChar]).uppercased()
        }

        return String(first2Words.first?.prefix(2) ?? "").uppercased()
    }
}
