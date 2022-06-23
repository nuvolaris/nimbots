//https://github.com/learning-apache-openwhisk/chapter10-golang/blob/master/vue/src/app/assets.go

const fs = require('fs');

ctypes = {
    "gif": "image/gif",
    "jpg": "image/jpeg",
    "png": "image/png",
    "ico": "image/vnd.microsoft.icon",
    "ttf": "font/ttf",
    "woff": "font/woff",
    "woff2": "font/woff2"
}

function isBinary(file) {
    return file.endsWith(".gif") ||
        file.endsWith(".jpg") ||
        file.endsWith(".png") ||
        file.endsWith(".ico") ||
        file.endsWith(".ttf") ||
        file.endsWith(".woff") ||
        file.endsWith(".woff2")
}


// replace base in html and css
function replaceBase(path, body) {
    if(!(path.endsWith(".css") || path.endsWith(".html")))
        return body
    let toFind = '/nuvolaris/default/faaswars'
    let toReplace = `/${process.env['__OW_NAMESPACE']}${process.env['__OW_ACTION_NAME']}`;
    while(body.indexOf(toFind) != -1)
        body = body.replace(toFind, toReplace)
    return body
}

function body(path) {
    let file = `${__dirname}${path}`
    if (!fs.existsSync(file)) {
        return {
            body: "<h1>504 not found</h1>",
            statusCode: 504
        }
    }
    let data = fs.readFileSync(file)
    if(isBinary(path)) 
        return {
            body: data.toString("base64"),
            statusCode: 200,
            headers: {
                "Content-Type": ctypes[path.split(".").pop()]
            }
        }
    return {
        body: replaceBase(path, data.toString("utf-8")),
        statusCode: 200,
    }
}

function check(args) {
    let res = { "ok": true }
    if (!("__ow_path" in args)) {
        res = { "error": "not deployed as --web=raw" }
    }
    else if (!("__OW_API_KEY" in process.env)) {
        res = { "error": "not deployed with -a provide-api-key true " }
    }
    else if (!("secret" in args)) {
        res = { "error": "not deployed with -p secret <password>" }
    }
    return res
}

function main(args) {
    // check parametes
    res = check(args)
    if ("error" in res) {
        return { "body": res }
    }
    let path = args['__ow_path'];
    // echo - disabled - for debug only 
    // do not leave enabled as leaks api keys
    /*
    if (path == "/echo") {
        return {
            "body": {
                "args": args,
                "env": process.env
            }
        }
    }/**/
    // check login
    if (path == "/login") {
        res = { "error": "wrong password" }
        if (args.password && args.password == args.secret)
            res = { "token": process.env["__OW_API_KEY"] }
        return { 
            "body": res
        }
    }
    // send body
    if (path != "") {
        return body(path) 
    }
    // return redirect if no path
    return { "body": `<script>location.href += "/index.html"</script>` }
}

module.exports.main = main