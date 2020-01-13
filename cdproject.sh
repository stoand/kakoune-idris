x=`dirname $1`
while [ "$x" != "/" ] ; do
    find "$x" -maxdepth 1 -name *.ipkg | egrep '.*' && cd "$x" && break
    x=`dirname "$x"`
done
