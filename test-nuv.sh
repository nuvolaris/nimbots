nuv -v
nuv a --help | grep "nuv action"
nuv a list
nuv p --help | grep "nuv package"
nuv p list
nuv ac --help | grep "nuv activation"
nuv ac list
nuv ru --help | grep "nuv rule"
nuv ru list
nuv tr --help | grep "nuv trigger"
nuv tr list
nuv a update hi hi.js --web=true
nuv i hi
nuv l
nuv i hi name=all
nuv url hi
nuv l
nuv ac list --limit 3 | awk '{print $4 " " $7 " " $8}'
