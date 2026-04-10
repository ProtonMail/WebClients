//
// AliasGenerator.swift
// Proton Pass - Created on 01/01/2026.
// Copyright (c) 2026 Proton Technologies AG
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

struct AliasGenerator: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel: AliasGeneratorViewModel
    @State private var showAdvancedOptions = false
    @State private var showMailboxSelector = false
    let onConfirm: (AliasCreationInfo) -> Void

    init(prefix: String,
         onConfirm: @escaping (AliasCreationInfo) -> Void) {
        _viewModel = .init(wrappedValue: .init(prefix: prefix))
        self.onConfirm = onConfirm
    }

    var body: some View {
        VStack(spacing: 0) {
            switch viewModel.state {
            case .loaded, .loading:
                ScrollView {
                    mainContent
                }

            case let .error(error):
                Spacer()
                RetryableErrorView(error: error.localizedDescription) {
                    Task {
                        await viewModel.refresh()
                    }
                }
                Spacer()
            }

            Divider()

            HStack {
                Spacer()
                Button(action: dismiss.callAsFunction,
                       label: { Text("Cancel", bundle: .module) })
                Button(action: { confirm(); dismiss() },
                       label: { Text("Confirm", bundle: .module) })
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.prefixError != nil)
            }
            .padding()
        }
        .frame(minHeight: showAdvancedOptions ? 350 : 200)
        .frame(width: 400)
        .task {
            await viewModel.refresh()
        }
    }
}

private extension AliasGenerator {
    @ViewBuilder
    var mainContent: some View {
        let aliasOptions = viewModel.state.aliasOptions
        VStack {
            Text("You're about to create:", bundle: .module)
                .foregroundStyle(.secondary)
                .padding(.top)
            suffix
            prefix(aliasOptions: aliasOptions)
            mailboxes(aliasOptions: aliasOptions)
            Spacer()
        }
        .animation(.default, value: showAdvancedOptions)
        .onChange(of: viewModel.prefix) {
            viewModel.validatePrefix()
        }
    }

    var placeholderText: some View {
        Text(verbatim: String(repeating: "dummy text", count: 10))
            .lineLimit(1)
            .frame(maxWidth: .infinity)
            .redacted(reason: .placeholder)
    }

    var suffix: some View {
        Group {
            if let selectedSuffix = viewModel.selectedSuffix {
                Text(verbatim: "\(viewModel.prefix)\(selectedSuffix.suffix)")
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                placeholderText
            }
        }
        .font(.title)
        .padding(.top, 8)
        .padding(.bottom, 16)
        .padding(.horizontal)
    }

    @ViewBuilder
    func prefix(aliasOptions: AliasOptions?) -> some View {
        if let aliasOptions, showAdvancedOptions {
            VStack(spacing: 0) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Prefix", bundle: .module)
                    TextField("Enter a prefix", text: $viewModel.prefix)
                        .textFieldStyle(.plain)
                    if let error = viewModel.prefixError {
                        Label(error.description, systemImage: "exclamationmark.circle.fill")
                            .font(.callout)
                            .foregroundStyle(PassColor.signalDanger)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .padding(8)

                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Suffix", bundle: .module)
                    Picker("Suffix", selection: $viewModel.selectedSuffix) {
                        ForEach(aliasOptions.suffixes, id: \.hashValue) { suffix in
                            Text(verbatim: suffix.suffix)
                                .tag(suffix)
                        }
                    }
                    .labelsHidden()
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(8)
            }
            .groupBoxed(paddingEdges: .horizontal)
        } else {
            Button(action: { showAdvancedOptions.toggle() },
                   label: {
                       Label("Advanced options", systemImage: "gearshape")
                           .foregroundStyle(.secondary)
                   })
                   .buttonStyle(.plain)
                   .disabled(aliasOptions == nil)
        }
    }

    func mailboxes(aliasOptions: AliasOptions?) -> some View {
        HStack {
            Image(systemName: "arrowshape.turn.up.forward")
                .resizable()
                .scaledToFit()
                .frame(width: 16)
                .foregroundStyle(.secondary)
            VStack(alignment: .leading) {
                Text("Forwards to", bundle: .module)
                    .font(.callout)
                    .foregroundStyle(.secondary)
                if aliasOptions != nil {
                    Text(verbatim: viewModel.selectedMailboxes.map(\.email).joined(separator: ", "))
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    placeholderText
                        .frame(alignment: .leading)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(8)
        .groupBoxed(paddingEdges: .horizontal)
        .contentShape(.rect)
        .buttonEmbedded {
            if aliasOptions != nil {
                showMailboxSelector.toggle()
            }
        }
        .popover(isPresented: $showMailboxSelector) {
            if let aliasOptions {
                MailboxSelector(selected: $viewModel.selectedMailboxes,
                                mailboxes: aliasOptions.mailboxes)
            }
        }
    }

    func confirm() {
        guard let suffix = viewModel.selectedSuffix,
              !viewModel.selectedMailboxes.isEmpty,
              viewModel.prefixError == nil else { return }
        onConfirm(.init(prefix: viewModel.prefix,
                        suffix: suffix,
                        mailboxes: viewModel.selectedMailboxes))
    }
}

private struct MailboxSelector: View {
    @Binding var selected: [AliasLinkedMailbox]
    let mailboxes: [AliasLinkedMailbox]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading) {
                ForEach(mailboxes) { mailbox in
                    Button(action: {
                        if selected.contains(mailbox), selected.count > 1 {
                            selected.removeAll(where: { $0 == mailbox })
                        } else {
                            selected.append(mailbox)
                        }
                    }, label: {
                        Label(title: {
                            Text(verbatim: mailbox.email)
                        }, icon: {
                            Image(systemName: "checkmark")
                                .opacity(selected.contains(mailbox) ? 1 : 0)
                        })
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(.rect)
                    })
                    .buttonStyle(.plain)

                    if mailbox != mailboxes.last {
                        Divider()
                    }
                }
            }
            .padding()
        }
        .frame(width: 250)
    }
}
