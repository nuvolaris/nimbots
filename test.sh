#!/bin/bash


# nuv wsk activation list --limit 3
# ID=$(nuv wsk activation list | awk 'NR==2 { print $3}')
# echo $ID
# nuv wsk activation logs $ID
# nuv wsk activation logs 


# init


pushd web/public
rm -f out.txt
cu() {
    echo ">>>" "$@" >>out.txt
    echo ">>>" "$@" 1>&2
    curl -s "$@" 2>&1
    echo ""
}
save() { 
    tee -a out.txt 
}
nuv wsk action delete faaswars
nuv wsk action update faaswars index.js --kind=nodejs:14 --web=true
# test params
URL=$(nuv wsk action get faaswars --url | tail +2)
cu $URL | grep error | save
nuv wsk action update faaswars index.js --kind=nodejs:14 --web=true -a provide-api-key true
cu $URL | grep error | save
nuv wsk action update faaswars index.js --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t
cu $URL | save

# check body
nuv wsk action update faaswars index.js --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t
# no pw
cu $URL/login | save
# right
cu "$URL/login?password=s3cr3t" | grep token | replace '\w' '*' -z | save
# wrong
cu $URL/login?password=pippo | save
# test you cannot override!
cu "$URL/login?password=pippo&secret=pippo" |  grep error | save

#cu -v "$URL/echo?password=s3cr3t"
#cu -v "$URL/login?password=s3cr3t"
#cu -v -X PUT "$URL/echo" -H "Content-Type: application/json" -d '{"password":"s3cr3t"}'
cu -v -X POST "$URL/login" -H "Content-Type: application/json" -d '{"password":"s3cr3t"}'

# test content
rm -f index.zip
nuv wsk action delete faaswars
zip -q -r index.zip  index.js package.json index.html favicon.ico src/JsBot.js
nuv wsk action update faaswars index.zip --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t

# export statics
cu $URL | save
cu -v $URL/index.html | grep Content-Type: | save
cu -v $URL/favicon.ico | grep Content-Type: | save
cu $URL/favicon.ico >out.tmp | save
file out.tmp | save
cu $URL/src/JsBot.js | grep function | save
cu -v $URL/nothing 2>&1 | egrep 'Content-Type:|h1' | save

mv out.txt ..
rm -f index.zip out.tmp
popd

#nuv wsk action update echo echo.js --web=true -a provide-api-key true -p secret s3cr3t
#ECHO=$(nuv wsk action get echo --url | tail +2)
#curl -s -X POST -H "Content-Type: application/json" -d '{"password":"s3cre3t"}' "$ECHO/pippo" 
