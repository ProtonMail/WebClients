//
// LoggedInView.swift
// Proton Pass - Created on 22/05/2024.
// Copyright (c) 2024 Proton Technologies AG
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

import Models
import ProtonCoreUIFoundations
import SwiftUI

struct LoggedInView: View {
    @StateObject private var viewModel: LoggedInViewModel

    init(viewModel: LoggedInViewModel) {
        _viewModel = .init(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            switch viewModel.userAndPlanObject {
            case .fetching:
                ProgressView()
            case let .fetched(object):
                view(for: object.plan, and: object.user)
            case let .error(error):
                RetryableErrorView(error: error,
                                   onRetry: { Task { await viewModel.fetchUserAndPlan() } })
            }
        }
        .navigationStackEmbeded()
        .task { await viewModel.fetchUserAndPlan() }
        .tint(.accent)
    }
}

private extension LoggedInView {
    // swiftlint:disable:next function_body_length
    func view(for plan: PassPlan, and user: User) -> some View {
        Form {
            Section {
                HStack {
                    Text(user.displayName)
                    Spacer()
                    Text(user.email)
                        .foregroundStyle(.secondary)
                }
                HStack {
                    HStack {
                        if let icon = plan.icon {
                            Image(uiImage: icon)
                                .scaledToFit()
                        }
                        Text(plan.displayName)
                    }
                    .foregroundStyle(plan.color)
                    Spacer()

                    if !plan.isFreeUser {
                        Button("Manage subscription", action: { viewModel.beginPaymentFlow(isUpgrading: false) })
                    }
                }
            }

            Section {
                if let privacyUrl = URL(string: "https://proton.me/legal/privacy") {
                    Link(destination: privacyUrl, label: {
                        Text("Privacy policy")
                    })
                }

                if let termsUrl = URL(string: "https://proton.me/legal/terms") {
                    Link(destination: termsUrl, label: {
                        Text("Terms of service")
                    })
                }
            }

            Section(content: {
                if let url = URL(string: "https://account.proton.me/u/0/mail/account-password") {
                    Link(destination: url, label: {
                        Text("Delete account")
                            .foregroundStyle(Color(uiColor: ColorProvider.NotificationError))
                    })
                }
            }, footer: {
                VStack(alignment: .center) {
                    // swiftlint:disable:next line_length
                    Text("This will permanently delete your Proton account and all of its data, including email, calendars and data stored in Drive. You will not be able to reactivate this account.")
                        .foregroundStyle(.secondary)
                        .padding(.bottom)
                    Text(verbatim: "Proton Pass for Safari")
                        .font(.body)
                    Text(verbatim: "\(Bundle.main.versionNumber)")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top)
            })
        }
        .toolbar {
            ToolbarItem(placement: .principal) {
                LogoView()
            }

            ToolbarItem(placement: .topBarTrailing) {
                if plan.isFreeUser {
                    Button("Upgrade", action: { viewModel.beginPaymentFlow(isUpgrading: true) })
                        .buttonStyle(.borderedProminent)
                }
            }
        }
    }
}

private extension PassPlan {
    var color: Color {
        switch planType {
        case .business, .plus:
            Color("PaidColor")
        default:
            Color.primary
        }
    }

    var icon: UIImage? {
        switch planType {
        case .business, .plus:
            UIImage(named: "BadgePaid")
        default:
            nil
        }
    }
}
