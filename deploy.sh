nuv wsk action update faaswars index.js --web=raw --kind=nodejs:14 -a provide-api-key true -p password pippo
exit

cd public
zip -r ../faaswars.zip *
cd ..
nuv wsk action update faaswars faaswars.zip --web=raw --kind=nodejs:14
