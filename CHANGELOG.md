3.0.0
  - Add `useDateType` option
  - Add `overrideTypes` option
  - Add `ssl` option
  - Better boolean zod schema
  - Better date-like zod schema
  - Refactored the code a lot to make TS happy
  - Add insertable, updateable and selectable schemas/types
  - Add default values when the field has it
  - Fix for nullable enum fields

2.2.0
  - Support ignoring tables with RegExp

2.1.0
  - Supports both an API and a CLI
  - Fixed the issue of different `table_name` between MySQL and MariaDB.
  - Fixed an issue where `tinyint unsigned` was returning `undefined`.

2.0.4
  - Add `requiredString` option

2.0.3
  - Exported type use camelCase as default

2.0.2
  - Fix extra line after last property

2.0.1
  - Add inferred type

2.0.0
  - Nullable as default instead of nullish
  - Add `camelCase` and `nullish` options

1.0.0
  - Initial Release
