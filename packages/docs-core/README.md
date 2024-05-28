# docs-core

Core library for business logic for Docs.

## Architecture

### Application

The entrypoint to the library is the `Application` instance. The Docs client creates a new Application() instance to interact with docs-core services and controllers.

The Docs client, which has relatively slim interaction with the library (compared to the editor), interact with the library via only the exposed methods of `ApplicationInterface`.

The editor sandbox on the other hand interacts with the EditorBridge in the library, and the bridge accesses the library via the EditorOrchestrator.

### Services and controllers

Services are classes that manage many resources, such as many comments in the `CommentService`, or allow for operations on disparate inputs, such as the `EncryptionService`.

Controllers on the other hand are services that control just 1 item, such as the `DocController` which controls a single document.

