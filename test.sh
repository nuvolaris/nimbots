#!/bin/bash

# nuv wsk activation list --limit 3
# ID=$(nuv wsk activation list | awk 'NR==2 { print $3}')
# echo $ID
# nuv wsk activation logs $ID
# nuv wsk activation logs 

# init

pushd web/public
rm -f out.txt
source init.src

nuv wsk action delete skybattle
## test params
nuv wsk action update skybattle index.js --kind=nodejs:14 --web=true
cu $URL | grep error | save
# "error": "not deployed with -a provide-api-key true "
nuv wsk action update skybattle index.js --kind=nodejs:14 --web=true -a provide-api-key true
cu $URL | grep error | save
# "error": "not deployed with -p secret <password>"
nuv wsk action update skybattle index.js --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t
cu $URL | save
# <script>location.href += "/index.html"</script>

## check body
nuv wsk action update skybattle index.js --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t
## no pw
cu $URL/login | grep error | save
# "error": "wrong password"
## right
cu "$URL/login?password=s3cr3t" | grep token | replace '\w' '*' -z | save
# "*****": "********-****-****-****-************:****************************************************************"
cu -v -X POST "$URL/login" -H "Content-Type: application/json" -d '{"password":"s3cr3t"}' | grep token | replace '\w' '*' -z | save
# "*****": "********-****-****-****-************:****************************************************************"
## wrong
cu $URL/login?password=pippo | grep error | save
# "error": "wrong password"
## test you cannot override!
cu "$URL/login?password=pippo&secret=pippo" |  grep error | save
# "error": "Request defines parameters that are not allowed (e.g., reserved properties)."

## test content
# source init.src
rm -f index.zip
zip -q -r index.zip  index.js package.json index.html favicon.ico JsBot.js
nuv wsk action update skybattle index.zip --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t

## export statics
cu $URL | save
# <script>location.href += "/index.html"</script>
cu -v $URL/index.html | grep Content-Type: | save
# < Content-Type: text/html; charset=UTF-8
cu -v $URL/favicon.ico | grep Content-Type: | save
# < Content-Type: image/vnd.microsoft.icon
cu $URL/favicon.ico >out.tmp
file out.tmp | save
# out.tmp: MS Windows icon resource - 4 icons, 64x64, 32 bits/pixel, 32x32, 32 bits/pixel
cu -v $URL/JsBot.js | grep function | save
# function main(args){
cu -v $URL/nothing 2>&1 | egrep 'Content-Type:|h1' | save
#< Content-Type: text/html; charset=UTF-8
#<h1>504 not found</h1>

# replace
nuv wsk package create test
nuv wsk action update test/skybattle index.zip --kind=nodejs:14 --web=true -a provide-api-key true -p secret s3cr3t
URL1=$(nuv wsk action get --url test/skybattle | tail +2)
cu $URL1/index.html | grep test
# location.pathname = "/api/v1/web/nuvolaris/nuvolaris/test/skybattle/index.html"

mv out.txt ../..
rm -f index.zip out.tmp
popd

#nuv wsk action update echo echo.js --web=true -a provide-api-key true -p secret s3cr3t
#ECHO=$(nuv wsk action get echo --url | tail +2)
#curl -s -X POST -H "Content-Type: application/json" -d '{"password":"s3cre3t"}' "$ECHO/pippo" 
if diff out.txt out.ok
then echo TEST: OK
else echo TEST: FAIL ; exit 1
fi
