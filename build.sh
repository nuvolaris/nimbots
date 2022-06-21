#!/bin/bash
rm faaswars.zip
pushd web
npm install
npm run build
cd public/api/v1/web/nuvolaris/default/faaswars
zip -r ../../../../../../../../faaswars.zip *
cd ../../../../../..
zip ../../faaswars.zip index.js package.json 
popd
