//
// CreateLoginView.swift
// Proton Pass - Created on 28/09/2025.
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

struct CreateLoginView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: CreateLoginViewModel
    @FocusState private var focusedField: Field?
    @State private var showAliasGenerator = false
    @State private var showPasswordGenerator = false
    @State private var noteHeight: CGFloat = 20

    enum Field: Hashable {
        case title, password, totp, url(index: Int)
    }

    init(url: String?) {
        _viewModel = .init(wrappedValue: .init(url: url))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 0) {
                    titleSection
                    usernameAndPasswordSection
                    urlsSection
                    noteSection
                    customFieldsSection
                    addCustomFieldButton
                }
            }

            Divider()

            HStack {
                Spacer()
                Button(action: dismiss.callAsFunction,
                       label: { Text("Cancel", bundle: .module) })
                Button(action: dismiss.callAsFunction,
                       label: { Text("Create", bundle: .module) })
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.title.isEmpty)
            }
            .padding()
        }
        .animation(.default, value: viewModel.title)
        .animation(.default, value: viewModel.customFields.count)
        .onChange(of: viewModel.password) {
            viewModel.updateStrength()
        }
        .sheet(isPresented: $showAliasGenerator) {
            AliasGenerator(prefix: viewModel.urlHost ?? "") {
                viewModel.set($0)
            }
        }
    }
}

private extension CreateLoginView {
    func title(_ title: LocalizedStringKey, value: any Collection) -> some View {
        Text(title, bundle: .module)
            .font(.callout)
            .foregroundStyle(value.isEmpty ? .primary : .secondary)
    }

    func icon(_ systemName: String, color: Color = .secondary) -> some View {
        Image(systemName: systemName)
            .scaledToFill()
            .frame(width: 16)
            .foregroundStyle(color)
    }

    var passwordFieldTitle: String {
        if let strength = viewModel.passwordStrength {
            #localized("Password") + " • " + strength.title
        } else {
            #localized("Password")
        }
    }

    var titleSection: some View {
        VStack(alignment: .leading) {
            title("Title", value: viewModel.title)
            TextField("Untitled", text: $viewModel.title)
                .font(.title)
                .focused($focusedField, equals: .title)
                .textFieldStyle(.plain)
            if focusedField != .title, viewModel.title.isEmpty {
                Label("Title is required", systemImage: "exclamationmark.circle.fill")
                    .font(.callout)
                    .foregroundStyle(PassColor.signalDanger)
            }
        }
        .padding(8)
        .groupBoxed(paddingEdges: [.horizontal, .top])
    }

    var usernameAndPasswordSection: some View {
        VStack {
            HStack {
                icon("person")

                VStack(alignment: .leading) {
                    title("Email or username", value: viewModel.email)
                    TextField("Enter email or username", text: $viewModel.email)
                        .textFieldStyle(.plain)
                }

                Button(action: { showAliasGenerator.toggle() },
                       label: {
                           PassIcon.alias
                               .resizable()
                               .scaledToFit()
                               .frame(width: 16)
                       })
                       .help("Generate alias")
            }
            .padding(8)

            Divider()

            HStack {
                icon(viewModel.passwordStrength?.imageName ?? "key",
                     color: viewModel.passwordStrength?.color ?? .secondary)

                VStack(alignment: .leading) {
                    Text(verbatim: passwordFieldTitle)
                        .font(.callout)
                        .foregroundStyle(viewModel.passwordStrength?.color ?? .primary)

                    SensitiveTextField(title: "Enter password",
                                       focusedField: $focusedField,
                                       field: .password,
                                       value: $viewModel.password)
                }
                .popover(isPresented: $showPasswordGenerator) {
                    PasswordGenerator {
                        viewModel.password = $0
                    }
                }

                Button(action: { showPasswordGenerator.toggle() },
                       label: { GeneratePasswordImage() })
                    .help("Generate password")
            }
            .padding(8)

            Divider()

            HStack {
                icon("lock")

                VStack(alignment: .leading) {
                    title("2FA secret key (TOTP)", value: viewModel.totpUri)
                    SensitiveTextField(title: "Add 2FA secret key",
                                       focusedField: $focusedField,
                                       field: .totp,
                                       value: $viewModel.totpUri)
                }
            }
            .padding(8)
        }
        .groupBoxed(paddingEdges: [.horizontal, .top])
    }

    var urlsSection: some View {
        HStack {
            icon("globe.europe.africa")

            VStack(alignment: .leading) {
                title("Websites", value: viewModel.urls)

                ForEach(0..<viewModel.urls.count, id: \.self) { index in
                    HStack {
                        VStack(alignment: .leading) {
                            TextField(text: $viewModel.urls[index]) {
                                Text(verbatim: "https://")
                            }
                            .textFieldStyle(.plain)
                            .focused($focusedField, equals: .url(index: index))

                            if focusedField != .url(index: index),
                               viewModel.urls[index].isEmpty,
                               index > 0 || index == 0 && viewModel.urls.count > 1 {
                                Label("URL cannot be empty", systemImage: "exclamationmark.circle.fill")
                                    .font(.callout)
                                    .foregroundStyle(PassColor.signalDanger)
                            }
                        }

                        Button(action: { viewModel.urls[index] = "" },
                               label: { Image(systemName: "xmark") })
                            .buttonStyle(.plain)
                    }
                    .padding(.bottom, 4)
                }

                Divider()

                Button(action: {
                    viewModel.urls.append("")
                    focusedField = .url(index: viewModel.urls.count - 1)
                }, label: {
                    Label("Add", systemImage: "plus")
                })
                .buttonStyle(.plain)
                .foregroundStyle(Color.accentColor)
            }
        }
        .padding(8)
        .groupBoxed(paddingEdges: [.horizontal, .top])
    }

    var noteSection: some View {
        HStack {
            icon("document")

            VStack(alignment: .leading) {
                title("Note", value: viewModel.note)
                NoBackgroundTextEditor(text: $viewModel.note,
                                       calculatedHeight: $noteHeight,
                                       placeholder: #localized("Add note"))
                    .frame(height: noteHeight)
            }
        }
        .padding(8)
        .groupBoxed(paddingEdges: [.horizontal, .top])
    }

    @ViewBuilder
    var customFieldsSection: some View {
        if !viewModel.customFields.isEmpty {
            VStack(alignment: .leading) {
                ForEach(0..<viewModel.customFields.count, id: \.self) { index in
                    let field = viewModel.customFields[index]
                    HStack {
                        icon(field.type.iconName)
                        VStack(alignment: .leading) {
                            TextField("Field name", text: $viewModel.customFields[index].title)
                                .textFieldStyle(.plain)
                            switch field.type {
                            case .date:
                                DatePicker(selection: $viewModel.customFields[index].date,
                                           displayedComponents: [.date]) {
                                    EmptyView()
                                }

                            default:
                                TextField(field.type.placeholder, text: $viewModel.customFields[index].value)
                                    .textFieldStyle(.plain)
                            }
                        }
                    }
                    .padding(8)

                    if index != viewModel.customFields.count - 1 {
                        Divider()
                    }
                }
            }
            .groupBoxed(paddingEdges: [.horizontal, .top])
        }
    }

    var addCustomFieldButton: some View {
        HStack {
            Menu(content: {
                ForEach(CustomFieldType.allCases, id: \.self) { type in
                    Button(action: { viewModel.customFields.append(.init(type: type)) },
                           label: { Label(type.title, image: type.iconName) })
                }
            }, label: {
                Label("Add more", systemImage: "plus")
                    .foregroundStyle(Color.accentColor)
            })
            .menuStyle(.button)
            .buttonStyle(.plain)

            Spacer()
        }
        .padding()
    }
}
