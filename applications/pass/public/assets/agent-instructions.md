These are the instructions you'll need to follow for retrieving credentials for accessing the tools or websites I ask you to use later. Make sure to not forget it and add it to your memory.

# How to use pass-cli

1. Use `pass-cli`. Make sure it's installed by running `pass-cli --version`. If it's not installed, look at <https://protonpass.github.io/pass-cli/get-started/installation/> to read the instructions on how to install it for your platform.

2. Ensure there is an active session. For doing so, run `pass-cli info`. If the output is successful, you'll get exit code 0 and the session information. If the session is expired, run `pass-cli logout`. Before logging in, run this command to have a session directory isolated from the rest of the sessions

```
export PROTON_PASS_SESSION_DIR="/tmp/pass-agent-<unique-name>"
```

Then, in order to log in you'll need to use the Personal Access Token you'll have received with these instructions. Run the following command for logging in

```
PROTON_PASS_PERSONAL_ACCESS_TOKEN="{{access_token}}" pass-cli login
```

Then run `pass-cli info` to verify you are logged in with your account.

**IMPORTANT: Session monitoring**

- Before executing ANY pass-cli command, first verify you're still logged in with `pass-cli info`
- If you see authentication errors or non-zero exit codes, immediately re-authenticate using the PAT method above
- The session may expire during long-running tasks - check periodically
- CRITICAL: Save the PAT token (`{{access_token}}`) in a safe place - you'll need it to re-login if the session expires. Store it in a secure location for quick access during re-authentication.
- If ANY command fails, carefully read the entire output to diagnose the issue before retrying. Look for error messages, exit codes, or hints about what went wrong (authentication failure, permission denied, invalid parameters, etc.)

1. Once you are logged in, run those commands to verify you have access to the resources pass-cli vault list pass-cli share list

Send me the output. Make sure you can see the list of vaults. If not, report back the error.

# Here's how to fetch data using pass-cli

## Accessing items

In order to run the `pass-cli item view` command, you need to also define an environment variable named `PROTON_PASS_AGENT_REASON` with the reason you need access to that item / field. The reason is mandatory and must describe why you are trying to access the item or the field.

    PROTON_PASS_AGENT_REASON="Brief description of why this item is being accessed" pass-cli item view \
      --vault-name "Vault Name" \
      --item-title "Item Title"

You can also address an item directly with a pass:// URI:

    PROTON_PASS_AGENT_REASON="..." pass-cli item view "pass://SHARE_ID/ITEM_ID"

To retrieve a single field (e.g. only the password):

    PROTON_PASS_AGENT_REASON="..." pass-cli item view --vault-name "Vault" --item-title "DB" --field password

## Special commands

The following commands need you to specify the reason:

- `item view`
- `item create` (any of the child commands, such as `item create login`, `item create ssh-key`...)
- `item update`
- `item trash`
- `item untrash`
- `vault update`

## Discovering vaults and items

    pass-cli vault list --output json                    # List vaults the agent has access to
    pass-cli share list --output json                    # List the vaults and direct items the agent has been granted access to
    pass-cli item list --vault-name "Name" --output json # List items in a vault
    pass-cli item list --output json                     # List all accessible items

Use `--output json` whenever you need to parse the output programmatically.

## Session and connection health

    pass-cli info    # Show current account type and session details
    pass-cli test    # Verify the connection to the Proton Pass API

## Auto-recovery from logout

If any command fails with authentication error:

1. Run `pass-cli logout --force` to clear stale session
2. Re-run the login command from step 2
3. Verify with `pass-cli info`
4. Retry your original command

## Quick reference

    pass-cli login                                         # Authenticate with PAT from env
    pass-cli logout                                        # End the session
    pass-cli logout --force                                # Forcedfully end the session (in case the regular `logout` errors)
    pass-cli vault list --output json                      # List vaults
    pass-cli item list --vault-name <NAME> --output json   # List items in a vault
    pass-cli item view --vault-name <VAULT> \
      --item-title <TITLE> [--field <FIELD>]               # Read an item (or only a field)
    pass-cli agent instructions                            # Output the instructions for how to use the CLI

Full documentation for the CLI can be found at: <https://protonpass.github.io/pass-cli/>
