# Pact contract testing

The Reference Data MFE is the Pact consumer. Its catalog contract exercises the
production `catalogsService.list` adapter; the Pact mock server is used only by
the consumer test.

```powershell
npm ci
npm run test:pact
```

The command writes the generated consumer contract to
`pacts/ReferenceDataMfe-ReferenceDataService.json`. Commit that file with the
consumer change so provider verification always uses a contract generated from
the real consumer adapter.

The Go provider verifier starts the real protected HTTP routes and injects a
test-only bearer token into verifier requests. Production JWT validation is not
changed: the verifier's token validator exists only in the `_test.go` harness
and grants only `REF_CATALOG_VIEW`.

```powershell
go run github.com/pact-foundation/pact-go/v2 install
go test -tags pact ./internal/adapter/in/http/hierarchy -run TestPactProvider -v
```

`pact-go install` downloads the Pact FFI library required by the Go verifier.
An interaction mismatch means either the MFE request no longer matches its
published expectations, or the provider's real HTTP route no longer returns a
compatible response.
