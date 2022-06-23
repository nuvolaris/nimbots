#!/bin/bash
rm -f skybattle.zip
bash mkdoc.sh API.md help.html "Help"
bash mkdoc.sh LICENSE.md license.html "License"
pushd web
npm install
npm run build
cd public/api/v1/web/nuvolaris/default/skybattle
zip -r ../../../../../../../../skybattle.zip *
cd ../../../../../..
zip ../../skybattle.zip index.js package.json 
popd
