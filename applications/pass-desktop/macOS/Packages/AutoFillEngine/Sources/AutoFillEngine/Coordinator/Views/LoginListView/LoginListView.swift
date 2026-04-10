//
// LoginListView.swift
// Proton Pass - Created on 25/09/2025.
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

import AuthenticationServices
import DesignSystem
import Macro
import SwiftUI

private let kMinWidth: CGFloat = 450

private enum ColumnWidth {
    static let itemMin: CGFloat = 200
    static let itemIdeal: CGFloat = 250
    static let itemMax: CGFloat = 400
    static let dateMin: CGFloat = 140
    static let dateMax: CGFloat = 180
}

struct LoginListView: View {
    @AppStorage(.showLastAutofillDate) private var showLastAutofillDate = true
    @AppStorage(.showModificationDate) private var showModificationDate = true
    @AppStorage(.showCreationDate) private var showCreationDate = false
    @AppStorage(.dateDisplayFormat) private var dateDisplayFormat = DateDisplayFormat.absoluteRelative
    @AppStorage(.autoFillTrigger) private var autoFillTrigger = AutoFillTrigger.ask
    @State private var sheet: Sheet?
    @State private var selectedLoginId: LoginUiModel.ID?
    @State private var selectedLogin: LoginUiModel?
    @State private var sortOrder: [KeyPathComparator<LoginUiModel>] = []
    @State private var searchTerm = ""
    @State private var viewModel = LoginListViewModel()
    private let onResult: (Result<AutoFillAction, any Error>) -> Void

    enum Sheet: String, Identifiable {
        case createLogin, showSettings

        var id: String {
            rawValue
        }
    }

    init(onResult: @escaping (Result<AutoFillAction, any Error>) -> Void) {
        self.onResult = onResult
    }

    var body: some View {
        VStack(spacing: 0) {
            switch viewModel.state {
            case .loading:
                Spacer()
                ProgressView()
                Spacer()

            case .loaded:
                loginTable

            case let .error(error):
                Spacer()
                RetryableErrorView(error: error) {
                    Task {
                        await viewModel.loadLogins()
                    }
                }
                Spacer()
            }

            Divider()

            bottomBar
        }
        .frame(width: viewWidth, height: 500)
        .animation(.default, value: viewModel.state)
        .animation(.default, value: viewModel.collection)
        // Required to make the format changes taken into account. SwiftUI bug?
        .animation(.default, value: dateDisplayFormat)
        .task(id: searchTerm) {
            await viewModel.loadLogins()
            try? await Task.sleep(for: .milliseconds(300))
            viewModel.filterLogins(searchTerm: searchTerm)
        }
        .sheet(item: $sheet) { sheet in
            switch sheet {
            case .createLogin:
                CreateLoginView(url: viewModel.url)
            case .showSettings:
                ConfigurationView(isLoggedIn: true, onClose: { self.sheet = nil })
            }
        }
        .alert(selectedLogin?.matched == true ? "Confirm autofill" : "Associate URL?",
               isPresented: $selectedLogin.mappedToBool(),
               actions: {
                   if let selectedLogin {
                       if selectedLogin.matched {
                           Button(action: { onResult(.success(.autofillPassword(selectedLogin))) },
                                  label: { Text("Autofill", bundle: .module) })
                       } else {
                           Button(action: { onResult(.success(.autofillPassword(selectedLogin))) },
                                  label: { Text("Just autofill", bundle: .module) })

                           Button(action: { onResult(.success(.associateAndAutofillPassword(selectedLogin))) },
                                  label: { Text("Associate and autofill", bundle: .module) })
                       }
                   }

                   Button(action: { selectedLoginId = nil; selectedLogin = nil },
                          label: { Text("Cancel", bundle: .module) })
               },
               message: {
                   let url = viewModel.url ?? ""
                   let title = selectedLogin?.title ?? ""
                   if selectedLogin?.matched == true {
                       Text("Do you want to autofill on \"\(url)\" with \"\(title)\"?", bundle: .module)
                   } else {
                       Text("Would you want to associate \"\(url)\" with \"\(title)\"", bundle: .module)
                   }
               })
    }
}

private extension LoginListView {
    var viewWidth: CGFloat {
        var width = ColumnWidth.itemIdeal + 100
        let dateColumnCount =
            [showLastAutofillDate, showModificationDate, showCreationDate].count(where: { $0 })
        width += ColumnWidth.dateMin * CGFloat(dateColumnCount)
        return max(kMinWidth, width)
    }

    var bottomBar: some View {
        HStack {
            Button(action: { sheet = .showSettings },
                   label: { Image(systemName: "gear") })
                .help("Settings")

            if viewModel.state.isLoaded {
                Button(action: { sheet = .createLogin },
                       label: { Image(systemName: "plus") })
                    .help("Add new item")

                SearchField(query: $searchTerm,
                            placeholder: #localized("Search", bundle: .module))
                    .frame(maxWidth: 250)
            }

            Spacer()

            Button("Done", action: { onResult(.success(.cancel)) })
                .buttonStyle(.borderedProminent)
        }
        .padding()
    }

    var loginTable: some View {
        Table(of: LoginUiModel.self,
              selection: $selectedLoginId,
              sortOrder: $sortOrder,
              columns: {
                  TableColumn("Item", value: \.title) { login in
                      columnContent(for: login) {
                          ItemRow(thumbnail: {
                                      SquircleThumbnail(data: .initials(login.title.initials()),
                                                        tintColor: PassColor.interactionNormMinor2,
                                                        backgroundColor: PassColor.interactionNormMajor2)
                                  },
                                  title: login.title,
                                  description: login.emailOrUsername,
                                  searchTerm: searchTerm,
                                  twoFaEnabled: login.twoFaEnabled,
                                  shared: login.shared)
                      }
                  }
                  .width(min: ColumnWidth.itemMin, ideal: ColumnWidth.itemIdeal, max: ColumnWidth.itemMax)

                  if showLastAutofillDate {
                      TableColumn("Date Autofilled", value: \.sortableLastAutofilledDate) { login in
                          columnContent(for: login) {
                              dateText(absolute: login.lastAutofilledDateString,
                                       relative: login.lastAutofilledRelativeDateString)
                          }
                      }
                      .width(min: ColumnWidth.dateMin, max: ColumnWidth.dateMax)
                  }

                  if showModificationDate {
                      TableColumn("Date Modified", value: \.modificationDate) { login in
                          columnContent(for: login) {
                              dateText(absolute: login.modificationDateString,
                                       relative: login.modificationRelativeDateString)
                          }
                      }
                      .width(min: ColumnWidth.dateMin, max: ColumnWidth.dateMax)
                  }

                  if showCreationDate {
                      TableColumn("Date Created", value: \.creationDate) { login in
                          columnContent(for: login) {
                              dateText(absolute: login.creationDateString,
                                       relative: login.creationRelativeDateString)
                          }
                      }
                      .width(min: ColumnWidth.dateMin, max: ColumnWidth.dateMax)
                  }
              },
              rows: {
                  Section(content: {
                      ForEach(viewModel.collection.matched) {
                          TableRow($0)
                      }
                  }, header: {
                      if let url = viewModel.url {
                          if viewModel.collection.matched.isEmpty, searchTerm.isEmpty {
                              Text("No guggestions for \(url)", bundle: .module)
                          } else {
                              Text("Suggestions for \(url)", bundle: .module)
                          }
                      }
                  })

                  if !viewModel.collection.notMatched.isEmpty {
                      Section(content: {
                          ForEach(viewModel.collection.notMatched) {
                              TableRow($0)
                          }
                      }, header: {
                          Text("Other items", bundle: .module)
                      })
                  }
              })
              .onChange(of: selectedLoginId) { _, newId in
                  guard let newId else { return }
                  if let login = viewModel.collection.getLogin(id: newId) {
                      switch autoFillTrigger {
                      case .ask:
                          self.selectedLogin = login

                      case .click:
                          askForAssociationOrAutofill(login)

                      case .doubleClick:
                          break
                      }
                  } else {
                      onResult(.failure(AutoFillError.itemNotFound(newId)))
                  }
              }
              .onChange(of: sortOrder) { _, newOrders in
                  if let newOrder = newOrders.first {
                      viewModel.sort(using: newOrder)
                  }
              }
              .showSpinner(viewModel.isSorting)
    }

    func columnContent(for login: LoginUiModel, @ViewBuilder content: () -> some View) -> some View {
        content()
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .contentShape(.rect)
            .accessibilityLabel(Text(verbatim: login.emailOrUsername))
            .simultaneousGesture(TapGesture(count: 1).onEnded {
                selectedLoginId = login.id
            })
            .simultaneousGesture(TapGesture(count: 2).onEnded {
                if autoFillTrigger == .doubleClick {
                    askForAssociationOrAutofill(login)
                }
            })
    }

    func dateText(absolute: String?, relative: String?) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Group {
                switch dateDisplayFormat {
                case .absoluteRelative:
                    if let absolute, let relative {
                        Text(verbatim: absolute)
                        Text(verbatim: "(\(relative))")
                    } else {
                        Text(verbatim: "--")
                    }

                case .absolute:
                    Text(verbatim: absolute ?? "--")

                case .relative:
                    Text(verbatim: relative ?? "--")
                }
            }
            .foregroundStyle(.secondary)
            .lineLimit(nil)
            .fixedSize(horizontal: false, vertical: true)
        }
    }

    func askForAssociationOrAutofill(_ login: LoginUiModel) {
        if login.matched {
            onResult(.success(.autofillPassword(login)))
        } else {
            selectedLogin = login
        }
    }
}
