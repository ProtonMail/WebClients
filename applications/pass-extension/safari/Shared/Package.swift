// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(name: "Shared",
                      platforms: [.iOS(.v15)],
                      products: [.library(name: "Shared", targets: ["Shared"])],
                      dependencies: [
                          .package(url: "https://github.com/lukacs-m/SimpleKeychain", exact: "0.1.2"),
                          .package(url: "https://github.com/ProtonMail/protoncore_ios", exact: "26.1.2")
                      ],
                      targets: [
                          .target(name: "Shared",
                                  dependencies: [
                                      .product(name: "SimpleKeychain", package: "SimpleKeychain"),
                                      .product(name: "ProtonCoreAuthentication", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreChallenge", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreCryptoGoImplementation",
                                               package: "protoncore_ios"),
                                      .product(name: "ProtonCoreDoh", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreForceUpgrade", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreHumanVerification", package: "protoncore_ios"),
                                      .product(name: "ProtonCoreNetworking", package: "protoncore_ios"),
                                      .product(name: "ProtonCorePaymentsUI", package: "protoncore_ios")
                                  ]),
                          .testTarget(name: "SharedTests", dependencies: ["Shared"], path: "Tests")
                      ])
