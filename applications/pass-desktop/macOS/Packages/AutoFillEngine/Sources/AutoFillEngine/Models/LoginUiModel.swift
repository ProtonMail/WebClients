//
// LoginUiModel.swift
// Proton Pass - Created on 23/09/2025.
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

private let kAbsoluteFormatStyle = Date.FormatStyle.dateTime
    .day(.twoDigits)
    .month(.abbreviated)
    .year(.extended())
    .hour(.twoDigits(amPM: .omitted))
    .minute(.twoDigits)

// swiftlint:disable:next modifier_order
private nonisolated(unsafe) let kRelativeDateFormatter = RelativeDateTimeFormatter()

struct LoginUiModel: Identifiable, Equatable {
    let id: String
    let title: String
    let emailOrUsername: String
    /// Matched with the current website URL or not
    let matched: Bool
    let twoFaEnabled: Bool
    let shared: Bool
    let creationDate: Date
    let creationDateString: String
    let creationRelativeDateString: String?
    let modificationDate: Date
    let modificationDateString: String
    let modificationRelativeDateString: String?
    let lastAutofilledDate: Date?
    let lastAutofilledDateString: String?
    let lastAutofilledRelativeDateString: String?

    init(id: String,
         title: String,
         emailOrUsername: String,
         matched: Bool,
         twoFaEnabled: Bool,
         shared: Bool,
         creationDate: Date,
         modificationDate: Date,
         lastAutofilledDate: Date?) {
        self.id = id
        self.title = title
        self.emailOrUsername = emailOrUsername
        self.matched = matched
        self.twoFaEnabled = twoFaEnabled
        self.shared = shared

        self.creationDate = creationDate
        creationDateString = creationDate.formatted(kAbsoluteFormatStyle)
        creationRelativeDateString = kRelativeDateFormatter.string(for: creationDate)

        self.modificationDate = modificationDate
        modificationDateString = modificationDate.formatted(kAbsoluteFormatStyle)
        modificationRelativeDateString = kRelativeDateFormatter.string(for: modificationDate)

        self.lastAutofilledDate = lastAutofilledDate
        lastAutofilledDateString = lastAutofilledDate?.formatted(kAbsoluteFormatStyle)
        lastAutofilledRelativeDateString = kRelativeDateFormatter.string(for: lastAutofilledDate)
    }

    var sortableLastAutofilledDate: Date {
        lastAutofilledDate ?? .init(timeIntervalSince1970: 0)
    }

    func match(_ searchTerm: String) -> Bool {
        guard !searchTerm.isEmpty else {
            return true
        }
        let searchTerm = searchTerm.lowercased()
        return title.lowercased().contains(searchTerm) || emailOrUsername.lowercased().contains(searchTerm)
    }
}

// swiftlint:disable multiline_call_arguments multiline_arguments
extension [LoginUiModel] {
    static var mock: Self {
        [
            LoginUiModel(id: "1", title: "Google", emailOrUsername: "john.smith@gmail.com",
                         matched: true, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_000_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_100_000),
                         lastAutofilledDate: nil),
            LoginUiModel(id: "2", title: "Facebook", emailOrUsername: "sarah.jones@yahoo.com",
                         matched: true, twoFaEnabled: false, shared: true,
                         creationDate: .now.addingTimeInterval(-100_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_110_000),
                         lastAutofilledDate: .now.addingTimeInterval(-10_000)),
            LoginUiModel(id: "3", title: "Twitter", emailOrUsername: "mike.wilson@outlook.com",
                         matched: true, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_020_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_120_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_220_000)),
            LoginUiModel(id: "4", title: "LinkedIn", emailOrUsername: "emily.brown@hotmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_030_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_130_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_230_000)),
            LoginUiModel(id: "5", title: "Amazon", emailOrUsername: "david.taylor@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_040_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_140_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_240_000)),
            LoginUiModel(id: "6", title: "Netflix", emailOrUsername: "jessica.anderson@icloud.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_050_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_150_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_250_000)),
            LoginUiModel(id: "7", title: "Spotify", emailOrUsername: "chris.thomas@proton.me",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_060_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_160_000),
                         lastAutofilledDate: nil),
            LoginUiModel(id: "8", title: "GitHub", emailOrUsername: "amanda.jackson@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_070_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_170_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_270_000)),
            LoginUiModel(id: "9", title: "Dropbox", emailOrUsername: "ryan.white@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_080_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_180_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_280_000)),
            LoginUiModel(id: "10", title: "Slack", emailOrUsername: "nicole.harris@outlook.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_090_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_190_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_290_000)),
            LoginUiModel(id: "11", title: "Discord", emailOrUsername: "james.martin@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_100_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_200_000),
                         lastAutofilledDate: nil),
            LoginUiModel(id: "12", title: "Instagram", emailOrUsername: "ashley.thompson@hotmail.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_110_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_210_000),
                         lastAutofilledDate: nil),
            LoginUiModel(id: "13", title: "PayPal", emailOrUsername: "kevin.garcia@icloud.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_120_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_220_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_320_000)),
            LoginUiModel(id: "14", title: "Adobe", emailOrUsername: "stephanie.martinez@gmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_130_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_230_000),
                         lastAutofilledDate: nil),
            LoginUiModel(id: "15", title: "Microsoft", emailOrUsername: "brandon.robinson@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_140_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_240_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_340_000)),
            LoginUiModel(id: "16", title: "Apple", emailOrUsername: "melissa.clark@outlook.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_150_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_250_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_350_000)),
            LoginUiModel(id: "17", title: "Zoom", emailOrUsername: "joshua.rodriguez@gmail.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_160_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_260_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_360_000)),
            LoginUiModel(id: "18", title: "Notion", emailOrUsername: "lauren.lewis@proton.me",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_170_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_270_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_370_000)),
            LoginUiModel(id: "19", title: "Figma", emailOrUsername: "andrew.lee@hotmail.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_180_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_280_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_380_000)),
            LoginUiModel(id: "20", title: "Trello", emailOrUsername: "rachel.walker@gmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_190_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_290_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_390_000)),
            LoginUiModel(id: "21", title: "Asana", emailOrUsername: "tyler.hall@icloud.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_200_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_300_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_400_000)),
            LoginUiModel(id: "22", title: "Jira", emailOrUsername: "megan.allen@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_210_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_310_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_410_000)),
            LoginUiModel(id: "23", title: "Reddit", emailOrUsername: "justin.young@gmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_220_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_320_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_420_000)),
            LoginUiModel(id: "24", title: "Pinterest", emailOrUsername: "hannah.king@outlook.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_230_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_330_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_430_000)),
            LoginUiModel(id: "25", title: "Twitch", emailOrUsername: "daniel.wright@proton.me",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_240_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_340_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_440_000)),
            LoginUiModel(id: "26", title: "Steam", emailOrUsername: "olivia.scott@gmail.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_250_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_350_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_450_000)),
            LoginUiModel(id: "27", title: "Epic Games", emailOrUsername: "matthew.green@hotmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_260_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_360_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_460_000)),
            LoginUiModel(id: "28", title: "PlayStation", emailOrUsername: "samantha.adams@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_270_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_370_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_470_000)),
            LoginUiModel(id: "29", title: "Xbox", emailOrUsername: "jacob.baker@gmail.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_280_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_380_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_480_000)),
            LoginUiModel(id: "30", title: "Nintendo", emailOrUsername: "elizabeth.nelson@icloud.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_290_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_390_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_490_000)),
            LoginUiModel(id: "31", title: "Uber", emailOrUsername: "nathan.carter@outlook.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_300_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_400_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_500_000)),
            LoginUiModel(id: "32", title: "Lyft", emailOrUsername: "victoria.mitchell@gmail.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_310_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_410_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_510_000)),
            LoginUiModel(id: "33", title: "DoorDash", emailOrUsername: "ethan.perez@proton.me",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_320_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_420_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_520_000)),
            LoginUiModel(id: "34", title: "Grubhub", emailOrUsername: "jennifer.roberts@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_330_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_430_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_530_000)),
            LoginUiModel(id: "35", title: "Airbnb", emailOrUsername: "alexander.turner@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_340_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_440_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_540_000)),
            LoginUiModel(id: "36", title: "Booking.com", emailOrUsername: "brittany.phillips@hotmail.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_350_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_450_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_550_000)),
            LoginUiModel(id: "37", title: "Expedia", emailOrUsername: "nicholas.campbell@icloud.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_360_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_460_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_560_000)),
            LoginUiModel(id: "38", title: "Delta Airlines", emailOrUsername: "kayla.parker@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_370_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_470_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_570_000)),
            LoginUiModel(id: "39", title: "United Airlines", emailOrUsername: "zachary.evans@outlook.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_380_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_480_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_580_000)),
            LoginUiModel(id: "40", title: "Bank of America", emailOrUsername: "christina.edwards@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_390_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_490_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_590_000)),
            LoginUiModel(id: "41", title: "Chase", emailOrUsername: "benjamin.collins@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_400_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_500_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_600_000)),
            LoginUiModel(id: "42", title: "Wells Fargo", emailOrUsername: "rebecca.stewart@proton.me",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_410_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_510_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_610_000)),
            LoginUiModel(id: "43", title: "Venmo", emailOrUsername: "connor.sanchez@hotmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_420_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_520_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_620_000)),
            LoginUiModel(id: "44", title: "Cash App", emailOrUsername: "allison.morris@gmail.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_430_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_530_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_630_000)),
            LoginUiModel(id: "45", title: "Coinbase", emailOrUsername: "dylan.rogers@icloud.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_440_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_540_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_640_000)),
            LoginUiModel(id: "46", title: "Robinhood", emailOrUsername: "natalie.reed@yahoo.com",
                         matched: false, twoFaEnabled: true, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_450_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_550_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_650_000)),
            LoginUiModel(id: "47", title: "Hulu", emailOrUsername: "austin.cook@gmail.com",
                         matched: false, twoFaEnabled: false, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_460_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_560_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_660_000)),
            LoginUiModel(id: "48", title: "HBO Max", emailOrUsername: "morgan.hayes@outlook.com",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_470_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_570_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_670_000)),
            LoginUiModel(id: "49", title: "Disney+", emailOrUsername: "kyle.bailey@proton.me",
                         matched: false, twoFaEnabled: false, shared: true,
                         creationDate: Date(timeIntervalSince1970: 1_700_480_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_580_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_680_000)),
            LoginUiModel(id: "50", title: "YouTube", emailOrUsername: "courtney.rivera@gmail.com",
                         matched: false, twoFaEnabled: true, shared: false,
                         creationDate: Date(timeIntervalSince1970: 1_700_490_000),
                         modificationDate: Date(timeIntervalSince1970: 1_700_590_000),
                         lastAutofilledDate: Date(timeIntervalSince1970: 1_700_690_000))
        ]
    }
}

// swiftlint:enable multiline_call_arguments multiline_arguments
