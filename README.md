# Idris syntax highlighting for Kakoune

Usage:

`cp kakoune-idris/idris.kak /usr/share/kak/autoload`

or, in `kakrc`:

`source ADD_PATH/kakoune-idris/idris.kak`

## IDE Actions

Run tests:

`nodemon ./ide-mode-test.js`

Add Idris IDE mode to `kakrc`

`map global normal <minus> ':enter-user-mode idris-ide<ret>'`

