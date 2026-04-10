//
// ConfigurationView.swift
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

import DesignSystem
import Macro
import SwiftUI

struct ConfigurationView: View {
    @AppStorage(.autoFillTrigger) private var autoFillTrigger = AutoFillTrigger.ask
    @AppStorage(.oneTimeCodeAuthentication) private var oneTimeCodeAuthentication = true
    @AppStorage(.copy2FaCode) private var copy2FaCode = true
    @AppStorage(.showLastAutofillDate) private var showLastAutofillDate = true
    @AppStorage(.showModificationDate) private var showModificationDate = true
    @AppStorage(.showCreationDate) private var showCreationDate = false
    @AppStorage(.dateDisplayFormat) private var dateDisplayFormat = DateDisplayFormat.absoluteRelative
    var bundle: Bundle = .main
    let isLoggedIn: Bool
    let onClose: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            if isLoggedIn {
                titleWith(subtitle: #localized("Version %@", bundle: .module, bundle.fullAppVersion))

                VStack(spacing: 0) {
                    autoFillTriggerOption
                    divider
                    oneTimeCodeAuthenticationOption
                    divider
                    copy2FAOption
                }
                .groupBoxed(paddingEdges: [.horizontal, .bottom])

                VStack(spacing: 0) {
                    showDatesOptions
                    divider
                    dateDisplayFormatOption
                }
                .groupBoxed(paddingEdges: [.horizontal, .bottom])
            } else {
                titleWith(subtitle: #localized("Please sign in to use Proton Pass AutoFill extension",
                                               bundle: .module))
            }

            Divider()

            HStack {
                Button("Open Proton Pass") {
                    if let url = URL(string: "protonpass://") {
                        NSWorkspace.shared.open(url)
                    }
                    onClose()
                }

                Spacer()

                Button("Done", action: onClose)
                    .buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .frame(width: 450)
        .task {
            // TODO: Remove this
            do {
                let manager = CredentialManager()
                try await manager.removeAllCredentials()
                try await manager.insert(credentials: [
                    .password(.init(id: "1",
                                    username: "john.doe@test.com",
                                    url: "https://www.autofilth.lol",
                                    lastUseTime: 1)),
                    .oneTimeCode(.init(id: "2",
                                       username: "jane.doe@test.com",
                                       url: "https://www.autofilth.lol",
                                       lastUseTime: 2))
                ])
            } catch {
                print(error.localizedDescription)
            }
        }
    }
}

private extension ConfigurationView {
    var divider: some View {
        Divider()
            .padding(.horizontal, 8)
    }

    func titleWith(subtitle: String) -> some View {
        HStack {
            PassIcon.passLogo
                .resizable()
                .scaledToFit()
                .frame(width: 32)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading) {
                Text(verbatim: "Proton Pass")
                Text(verbatim: subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding()
    }

    func optionDescription(title: LocalizedStringKey, description: LocalizedStringKey) -> some View {
        VStack {
            Text(title, bundle: .module)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text(description, bundle: .module)
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    var autoFillTriggerOption: some View {
        HStack {
            optionDescription(title: "In-Page AutoFill",
                              description: "Set the interaction for the autofill menu in websites and apps")

            Spacer()

            Picker(selection: $autoFillTrigger) {
                ForEach(AutoFillTrigger.allCases, id: \.self) { trigger in
                    Text(trigger.title, bundle: .module)
                        .tag(trigger)
                }
            } label: {
                EmptyView()
            }
            .pickerStyle(.menu)
            .fixedSize()
        }
        .padding(8)
    }

    var oneTimeCodeAuthenticationOption: some View {
        Toggle(isOn: $oneTimeCodeAuthentication) {
            optionDescription(title: "One-Time Code AutoFill",
                              // swiftlint:disable:next line_length
                              description: "Verify your identity before filling verification codes in websites and apps")
        }
        .toggleStyle(.switch)
        .controlSize(.small)
        .padding(8)
    }

    var copy2FAOption: some View {
        Toggle(isOn: $copy2FaCode) {
            optionDescription(title: "Copy 2FA Code",
                              description: "Automatically copy 2FA code after autofilling password")
        }
        .toggleStyle(.switch)
        .controlSize(.small)
        .padding(8)
    }

    var showDatesOptions: some View {
        HStack {
            Text("Show Dates", bundle: .module)
            Spacer()
            Group {
                Toggle("Autofilled", isOn: $showLastAutofillDate)
                    .help("When an item was last autofilled")
                Toggle("Modified", isOn: $showModificationDate)
                    .help("When an item was last modified")
                Toggle("Created", isOn: $showCreationDate)
                    .help("When an item was created")
            }
            .toggleStyle(.checkbox)
        }
        .padding(8)
    }

    var dateDisplayFormatOption: some View {
        HStack {
            Text("Date & Time Display", bundle: .module)
            Spacer()
            Picker(selection: $dateDisplayFormat) {
                ForEach(DateDisplayFormat.allCases, id: \.self) { format in
                    Text(format.title, bundle: .module)
                        .tag(format)
                }
            } label: {
                EmptyView()
            }
            .pickerStyle(.menu)
            .fixedSize()
        }
        .padding(8)
    }
}
