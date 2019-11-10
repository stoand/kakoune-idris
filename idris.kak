# http://idris.org
# ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾

# Detection
# ‾‾‾‾‾‾‾‾‾

hook global BufCreate .*[.](idr|blod) %{
    set-option buffer filetype idris
    # b
    # m
    # n
    # o
    # t
    # u
    # v
    map buffer user d ':idris-ide interpret<ret>' -docstring 'Idris Interpret'
    map buffer user t ':idris-ide-inner-word; idris-ide caseSplit<ret>' -docstring 'Idris Interpret'
    map buffer user u ':idris-ide-inner-word; idris-ide addClause<ret>' -docstring 'Idris Interpret'
    
    define-command -hidden idris-ide-inner-word -params 0 %{
        execute-keys <A-i> w
    }
    
    define-command -docstring 'Invoke Idris IDE command' idris-ide -params 1 %{
        write
    	eval %sh{
        	printf "$1\n$kak_bufname\n$kak_selection\n$kak_cursor_line\n$kak_cursor_char_column" |
        	node ~/.kakoune-idris/ide-mode-run.js
    	}
    }
}


# Highlighters
# ‾‾‾‾‾‾‾‾‾‾‾‾

add-highlighter shared/idris regions
add-highlighter shared/idris/code default-region group
add-highlighter shared/idris/string       region (?<!'\\)(?<!')"                 (?<!\\)(\\\\)*"  fill string
add-highlighter shared/idris/macro        region ^\h*?\K#                        (?<!\\)\n        fill meta
add-highlighter shared/idris/pragma       region -recurse \{- \{-#               '#-\}'           fill meta
add-highlighter shared/idris/comment      region -recurse \{- \{-                  -\}            fill comment
add-highlighter shared/idris/line_comment region --(?:[^!#$%&*+./<>?@\\\^|~=]|$) $                fill comment
add-highlighter shared/idris/line_comment2 region \|\|\|(?:[^!#$%&*+./<>?@\\\^|~=]|$) $           fill comment

add-highlighter shared/idris/code/ regex (?<!')\b0x+[A-Fa-f0-9]+ 0:value
add-highlighter shared/idris/code/ regex (?<!')\b\d+([.]\d+)? 0:value

add-highlighter shared/idris/code/ regex (?<!')\b(partial|assess|assert_total|default|elim|error_reverse|hide|name|reflection|error_handlers|language|flag|dynamic|provide|inline|used|no_implicit|hint|extern|unqualified|error_handler)(?!')\b 0:keyword
add-highlighter shared/idris/code/ regex (?<!')\b(of|case|do|data|default|proof|tactic)(?!')\b 0:keyword

# Idris Tactic - TODO: restrict tactic keywords to their context
add-highlighter shared/idris/code/ regex (?<!')\b(intros|rewrite|exact|refine|trivial|let|focus|try|compute|solve|attack|reflect|fill|applyTactic)(?!')\b 0:keyword

# The complications below is because period has many uses:
# As function composition operator (possibly without spaces) like "." and "f.g"
# Hierarchical modules like "Data.Maybe"
# Qualified imports like "Data.Maybe.Just", "Data.Maybe.maybe", "Control.Applicative.<$>"
# Quantifier separator in "forall a . [a] -> [a]"
# Enum comprehensions like "[1..]" and "[a..b]" (making ".." and "Module..." illegal)

# matches uppercase identifiers:  Monad Control.Monad
# not non-space separated dot:    Just.const
add-highlighter shared/idris/code/ regex \b([A-Z]['\w]*\.)*[A-Z]['\w]*(?!['\w])(?![.a-z]) 0:variable

# matches infix identifier: `mod` `Apa._T'M`
add-highlighter shared/idris/code/ regex `\b([A-Z]['\w]*\.)*[\w]['\w]*` 0:operator
# matches imported operators: M.! M.. Control.Monad.>>
# not operator keywords:      M... M.->
add-highlighter shared/idris/code/ regex \b[A-Z]['\w]*\.[~<=>|:!?/.@$*&#%+\^\-\\]+ 0:operator
# matches dot: .
# not possibly incomplete import:  a.
# not other operators:             !. .!
add-highlighter shared/idris/code/ regex (?<![\w~<=>|:!?/.@$*&#%+\^\-\\])\.(?![~<=>|:!?/.@$*&#%+\^\-\\]) 0:operator
# matches other operators: ... > < <= ^ <*> <$> etc
# not dot: .
# not operator keywords:  @ .. -> :: ~
add-highlighter shared/idris/code/ regex (?<![~<=>|:!?/.@$*&#%+\^\-\\])[~<=>|:!?/.@$*&#%+\^\-\\]+ 0:operator

# matches operator keywords: @ ->
add-highlighter shared/idris/code/ regex (?<![~<=>|:!?/.@$*&#%+\^\-\\])(@|~|<-|->|=>|::|=|:|[|])(?![~<=>|:!?/.@$*&#%+\^\-\\]) 1:keyword
# matches: forall [..variables..] .
# not the variables
add-highlighter shared/idris/code/ regex \b(forall)\b[^.\n]*?(\.) 1:keyword 2:keyword

# matches 'x' '\\' '\'' '\n' '\0'
# not incomplete literals: '\'
# not valid identifiers:   w' _'
add-highlighter shared/idris/code/ regex \B'([^\\]|[\\]['"\w\d\\])' 0:string
# this has to come after operators so '-' etc is correct

# Commands
# ‾‾‾‾‾‾‾‾

# http://en.wikibooks.org/wiki/Haskell/Indentation

define-command -hidden idris-trim-indent %{
    # remove trailing white spaces
    try %{ execute-keys -draft -itersel <a-x> s \h+$ <ret> d }
}

define-command -hidden idris-indent-on-new-line %{
    evaluate-commands -draft -itersel %{
        # copy -- comments prefix and following white spaces
        try %{ execute-keys -draft k <a-x> s ^\h*\K--\h* <ret> y gh j P }
        # preserve previous line indent
        try %{ execute-keys -draft \; K <a-&> }
        # align to first clause
        try %{ execute-keys -draft \; k x X s ^\h*(if|then|else)?\h*(([\w']+\h+)+=)?\h*(case\h+[\w']+\h+of|do|let|where)\h+\K.* <ret> s \A|.\z <ret> & }
        # filter previous line
        try %{ execute-keys -draft k : idris-trim-indent <ret> }
        # indent after lines beginning with condition or ending with expression or =(
        try %{ execute-keys -draft \; k x <a-k> ^\h*(if)|(case\h+[\w']+\h+of|do|let|where|[=(])$ <ret> j <a-gt> }
    }
}

# Initialization
# ‾‾‾‾‾‾‾‾‾‾‾‾‾‾

hook -group idris-highlight global WinSetOption filetype=idris %{
    add-highlighter window/idris ref idris
    hook -once -always window WinSetOption filetype=.* %{ remove-highlighter window/idris }
}

hook global WinSetOption filetype=idris %{
    set-option window extra_word_chars '_' "'"
    hook window ModeChange insert:.* -group idris-trim-indent  idris-trim-indent
    hook window InsertChar \n -group idris-indent idris-indent-on-new-line

    hook -once -always window WinSetOption filetype=.* %{ remove-hooks window idris-.+ }
}
