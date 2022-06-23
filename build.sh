#!/bin/bash
rm faaswars.zip
bash mkdoc.sh API.md help.html "Help"
bash mkdoc.sh LICENSE.md license.html "License"
pushd web
npm install
npm run build
cd public/api/v1/web/nuvolaris/default/faaswars
zip -r ../../../../../../../../faaswars.zip *
cd ../../../../../..
zip ../../faaswars.zip index.js package.json 
popd
