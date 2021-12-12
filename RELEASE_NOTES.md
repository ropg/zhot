# Release Notes

### 1.0.0

- Initial release

### 1.1.0

- `config.evaluate` now gets `config` object as argument, more arguments can be passed with `config.evaluateArgs`.
- `-H` / `--head` turns off headless mode for CLI tool.
- If `config.evaluate` returns object with `cancelScreenshot` property, everything past that is cancelled and `config.evaluate`'s return value is returned from zhot.

### 1.2.0

- Added `extraHTTPHeaders` as property to `config` object.

### 1.2.1

- In `-b` / `--writeCookies`, the viewport size now tracks the window size.
