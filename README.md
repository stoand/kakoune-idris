# Idris Highlighting and IDE Actions for Kakoune Editor

[![asciicast](https://asciinema.org/a/dMtEyDF58Cm8VZN1MQ2IYiZaq.png)](https://asciinema.org/a/dMtEyDF58Cm8VZN1MQ2IYiZaq)

## Install

Ensure NodeJS and [Idris 2](https://github.com/edwinb/Idris2) are installed.


Clone the repository:

```
git clone https://github.com/stoand/kakoune-idris ~/.kakoune-idris/
```


Add to your `kakrc`:

```
source ~/.kakoune-idris/idris.kak
map global normal <minus> ':enter-user-mode idris-ide<ret>'
```

Note: this sets the minus key to be the idris ide mode key.
This can be changed by replacing the `<minus>` above with the desired key.

## Usage

```
# The plugin expects the "*.ipkg" file to be in the same folder as the "src" dir
# Otherwise there may be a "Module name * does not match file name *" error 
cd myproject
touch myproject.ipkg
mkdir src
kak src/Main.idr
```

## Testing

```
# Install nodemon to watch for changes
npm i -g nodemon

# Run action tests
nodemon ./ide-mode-test.js

# Run protocol parser tests
nodemon ./parse-protocol-expr-test.js
```

