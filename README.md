# Idris Highlighting and IDE Actions for Kakoune Editor

[![asciicast](https://asciinema.org/a/XVGE4eFCWckJAbSCcyettcnMj.png)](https://asciinema.org/a/XVGE4eFCWckJAbSCcyettcnMj)

## Install

Add to your `kakrc`:

```
source CLONED_DIRECTORY/kakoune-idris/kakoune-idris/idris.kak
map global normal <minus> ':enter-user-mode idris-ide<ret>'
```

## Testing

Run tests:

`nodemon ./ide-mode-test.js`

