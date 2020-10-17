# http://idris.org
# ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾

# Configuration
# ‾‾‾‾‾‾‾‾‾‾‾‾‾

declare-option -docstring 'path to the folder containing the nodejs implementation of the plugin' \
    str idris_implementation_root %sh{dirname "$kak_source"}

declare-option -docstring 'path to the ipkg file that configures this project' \
    str idris_ipkg_path "<empty>"

# Detection
# ‾‾‾‾‾‾‾‾‾

hook global BufCreate .*[.](idr|blod) %{
    set-option buffer filetype idris

	# Mixing tabs and spaces will break
	# indentation sensitive syntax checking
    hook buffer InsertChar \t %{ try %{
      execute-keys -draft "h<a-h><a-k>\A\h+\z<ret><a-;>;%opt{indentwidth}@"
    }}

    hook buffer InsertDelete ' ' %{ try %{
      execute-keys -draft 'h<a-h><a-k>\A\h+\z<ret>i<space><esc><lt>'
    }}
}

# Idris IDE Mode
# ‾‾‾‾‾‾‾‾‾‾‾‾‾‾

declare-user-mode idris-ide

map global idris-ide i ':idris-ide interpret<ret>' -docstring 'interpret'
map global idris-ide t ':idris-ide-inner-word; idris-ide typeOf<ret>' -docstring 'type-of'
map global idris-ide a ':idris-ide-inner-word; idris-ide addClause<ret>' -docstring 'add-clause'
map global idris-ide s ':idris-ide-inner-word; idris-ide caseSplit<ret>' -docstring 'case-split'
map global idris-ide p ':idris-ide-inner-word; idris-ide proofSearch<ret>' -docstring 'proof-search'
map global idris-ide d ':idris-ide-inner-word; idris-ide generateDef<ret>' -docstring 'generate-def'
map global idris-ide l ':idris-ide-inner-word; idris-ide makeLemma<ret>' -docstring 'make-lemma'
map global idris-ide w ':idris-ide-inner-word; idris-ide makeWith<ret>' -docstring 'make-with'

define-command -hidden idris-ide-inner-word -params 0 %{
    execute-keys <A-i> w
}

define-command -docstring 'Invoke Idris IDE command' idris-ide -params 1 %{
    write
	eval %sh{

    	if [ "$kak_opt_idris_ipkg_path" = "<empty>" ]; then
      	x=`dirname $kak_opt_idris_ipkg_path`
      	current=`pwd`
      	while [ "$x" != "/" ] && [ "$x" != "." ] ; do
        	find "$x" -maxdepth 1 -name *.ipkg | egrep '.*' && cd "$x" && break
        	x=`dirname "$x"`
      	done
      	x="$(find "$x" -maxdepth 1 -name *.ipkg)"
      	export kak_idris_ipkg_path="$(echo "$(cd "$(dirname "$x")"; pwd -P)/$(basename "$x")")"
      	cd "$current"
    	else
      	export kak_idris_ipkg_path="$kak_opt_idris_ipkg_path"
    	fi

    	if ! test -f "$kak_idris_ipkg_path"; then
      	echo "fail \"'.ipkg' configuration file could not be found\""
      	exit
    	fi

    	export kak_idris_command="$1"
    	export kak_idris_file="$kak_buffile"
    	export kak_idris_selection="$kak_selection"
    	export kak_idris_line="$kak_cursor_line"
    	export kak_idris_column="$kak_cursor_char_column"
    	export kak_idris_project_root="$(dirname "$kak_idris_ipkg_path")"

    	node "$kak_opt_idris_implementation_root/ide-mode-run.js"
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

add-highlighter shared/idris/code/ regex (?<!')\b(where|constructor|record|partial|assess|assert_total|default|elim|error_reverse|hide|name|reflection|error_handlers|language|flag|dynamic|provide|inline|used|no_implicit|hint|extern|unqualified|error_handler)(?!')\b 0:keyword
add-highlighter shared/idris/code/ regex (?<!')\b(module|import|if|in|then|else|of|case|do|data|default|proof|tactic)(?!')\b 0:keyword

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
