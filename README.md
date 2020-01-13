# Idris Highlighting and IDE Actions for Kakoune Editor

[![asciicast](https://asciinema.org/a/XVGE4eFCWckJAbSCcyettcnMj.png)](https://asciinema.org/a/XVGE4eFCWckJAbSCcyettcnMj)

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
This can be changed by replacing the "<minus>" above with the desired key.

## Testing

`nodemon ./ide-mode-test.js`

