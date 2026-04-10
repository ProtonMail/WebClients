//
// ItemRow.swift
// Proton Pass - Created on 02/10/2025.
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

struct ItemRow<Thumbnail: View>: View {
    let thumbnail: Thumbnail
    let title: String
    let titleLineLimit: Int
    let description: String
    let descriptionLineLimit: Int
    let searchTerm: String
    let twoFaEnabled: Bool
    let shared: Bool

    init(@ViewBuilder thumbnail: () -> Thumbnail,
         title: String,
         titleLineLimit: Int = 2,
         description: String,
         descriptionLineLimit: Int = 1,
         searchTerm: String,
         twoFaEnabled: Bool,
         shared: Bool) {
        self.thumbnail = thumbnail()
        self.title = title
        self.titleLineLimit = titleLineLimit
        self.description = description
        self.descriptionLineLimit = descriptionLineLimit
        self.searchTerm = searchTerm
        self.twoFaEnabled = twoFaEnabled
        self.shared = shared
    }

    var body: some View {
        HStack(spacing: 16) {
            VStack {
                Spacer()
                thumbnail
                    .frame(width: 40)
                Spacer()
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    HighlightText(text: title,
                                  highlight: searchTerm,
                                  lineLimit: titleLineLimit)
                        .fixedSize(horizontal: false, vertical: true)

                    if twoFaEnabled {
                        PassIcon.shieldLock
                            .resizable()
                            .scaledToFit()
                            .frame(width: 16)
                            .foregroundStyle(PassColor.loginInteractionNormMajor1)
                            .help("This item has 2FA enabled")
                    }

                    if shared {
                        Image(systemName: "person.2.fill")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 16)
                            .foregroundStyle(PassColor.textNorm)
                            .help("This item is being shared")
                    }
                }

                if !description.isEmpty {
                    HighlightText(text: description,
                                  highlight: searchTerm,
                                  lineLimit: descriptionLineLimit)
                        .font(.callout)
                        .minimumScaleFactor(descriptionLineLimit > 1 ? 0.75 : 1.0)
                        .foregroundStyle(PassColor.textWeak)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxHeight: .infinity)
                }
            }
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
