//
// PassColor.swift
// Proton Pass - Created on 05/04/2023.
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

import SwiftUI

public enum PassColor: Sendable {}

public extension PassColor {
    static let inputBackgroundNorm = Color.inputBackgroundNorm
    static let inputBorderNorm = Color.inputBorderNorm
    static let borderWeak = Color.borderWeak
    static let interactionNorm = Color.interactionNorm
    static let interactionNormMajor1 = Color.interactionNormMajor1
    static let interactionNormMajor2 = Color.interactionNormMajor2
    static let interactionNormMinor1 = Color.interactionNormMinor1
    static let interactionNormMinor2 = Color.interactionNormMinor2
}

// MARK: - Background

public extension PassColor {
    static let backdrop = Color.backdrop
    static let backgroundMedium = Color.backgroundMedium
    static let backgroundNorm = Color.backgroundNorm
    static let backgroundStrong = Color.backgroundStrong
    static let backgroundWeak = Color.backgroundWeak
    static let tabBarBackground = Color.tabBarBackground

    static let newBackgroundStrong = Color.newBackgroundStrong
}

// MARK: - Items

public extension PassColor {
    static let aliasInteractionNorm = Color.aliasInteractionNorm
    static let aliasInteractionNormMajor1 = Color.aliasInteractionNormMajor1
    static let aliasInteractionNormMajor2 = Color.aliasInteractionNormMajor2
    static let aliasInteractionNormMinor1 = Color.aliasInteractionNormMinor1
    static let aliasInteractionNormMinor2 = Color.aliasInteractionNormMinor2

    static let cardInteractionNorm = Color.cardInteractionNorm
    static let cardInteractionNormMajor1 = Color.cardInteractionNormMajor1
    static let cardInteractionNormMajor2 = Color.cardInteractionNormMajor2
    static let cardInteractionNormMinor1 = Color.cardInteractionNormMinor1
    static let cardInteractionNormMinor2 = Color.cardInteractionNormMinor2

    static let loginInteractionNorm = Color.loginInteractionNorm
    static let loginInteractionNormMajor1 = Color.loginInteractionNormMajor1
    static let loginInteractionNormMajor2 = Color.loginInteractionNormMajor2
    static let loginInteractionNormMinor1 = Color.loginInteractionNormMinor1
    static let loginInteractionNormMinor2 = Color.loginInteractionNormMinor2

    static let noteInteractionNorm = Color.noteInteractionNorm
    static let noteInteractionNormMajor1 = Color.noteInteractionNormMajor1
    static let noteInteractionNormMajor2 = Color.noteInteractionNormMajor2
    static let noteInteractionNormMinor1 = Color.noteInteractionNormMinor1
    static let noteInteractionNormMinor2 = Color.noteInteractionNormMinor2

    static let passwordInteractionNorm = Color.passwordInteractionNorm
    static let passwordInteractionNormMajor1 = Color.passwordInteractionNormMajor1
    static let passwordInteractionNormMajor2 = Color.passwordInteractionNormMajor2
    static let passwordInteractionNormMinor1 = Color.passwordInteractionNormMinor1
    static let passwordInteractionNormMinor2 = Color.passwordInteractionNormMinor2

    static let customItemBackground = Color.customItemBackground
}

// MARK: - Signals

public extension PassColor {
    static let signalDanger = Color.signalDanger
    static let signalInfo = Color.signalInfo
    static let signalSuccess = Color.signalSuccess
    static let signalWarning = Color.signalWarning
}

// MARK: - Texts

public extension PassColor {
    static let textDisabled = Color.textDisabled
    static let textHint = Color.textHint
    static let textInvert = Color.textInvert
    static let textNorm = Color.textNorm
    static let textWeak = Color.textWeak
}

// MARK: - Vaults

public extension PassColor {
    static let vaultChestnutRose = Color.vaultChestnutRose
    static let vaultDeYork = Color.vaultDeYork
    static let vaultHeliotrope = Color.vaultHeliotrope
    static let vaultJordyBlue = Color.vaultJordyBlue
    static let vaultLavenderMagenta = Color.vaultLavenderMagenta
    static let vaultMarigoldYellow = Color.vaultMarigoldYellow
    static let vaultMauvelous = Color.vaultMauvelous
    static let vaultMercury = Color.vaultMercury
    static let vaultPorsche = Color.vaultPorsche
    static let vaultWaterLeaf = Color.vaultWaterLeaf
}
