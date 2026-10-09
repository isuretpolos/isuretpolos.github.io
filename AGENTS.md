# Repository instructions

- NEVER COMMIT ANYTHING.
- NEVER PUSH ANYTHING.
- Format new code in IntelliJ IDEA style, readable and simple.
- In Angular use callbacks or Promise chains rather than await.
- Comments must be in English.

## Versioning

Root version.json is the application release metadata. Never increment by manually editing it.
For each requested bugfix use `node UI/scripts/version.mjs bugfix "Description"` once per completed change.
For a backwards-compatible feature use `minor`; for a breaking major release use `major`.
Follow an explicit version instruction from the user when provided.
Run the version script before the production build. Ordinary builds sync the current version without bumping it.
The initial release for icons/versioning is 1.0.0 with description "First version".
