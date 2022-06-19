//https://github.com/learning-apache-openwhisk/chapter10-golang/blob/master/vue/src/app/assets.go

const fs = require('fs');

ctypes = {
    "html": [true, "text/html"],
    "css":  [true, "text/css"],
    "js":   [true, "text/javascript"],
    "jpg":  [false, "image/jpeg"],
    "png":  [false, "image/png"],
    "ico":  [false, "image/vnd.microsoft.icon"],
    "ttf":  [false, "font/ttf"],
    "woff": [false, "font/woff"],
    "woff2":[false, "font/woff2"],
}

function body(path) {
    let file = `${__dirname}${path}`
    let ext = path.split(".").pop()
    let ctype = ext in ctypes ? ctypes[ext] : [false, 'application/octet-stream']
    
    if(! fs.existsSync(file)) {
        return {
            body: "<h1> 504 not found</h1>",
            statusCode: 504
        }
    }
    let data = fs.readFileSync(file)
    return {
        body: ctype[0] ? data.toString("utf-8") : data.toString("base64"),
        headers: {
            "Content-Type": ctype[1],
        }, 
        statusCode: 200
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
    // check login
    let path = args['__ow_path'];
    if (path == "/login") {
        res = { "error": "wrong password" }
        if (args.password && args.password == args.secret)
            res = { "token": process.env["__OW_API_KEY"] }
        return { "body": res }
    }
    // send body
    if (path != "") {
        return body(path)
    }
    // return redirect
    return { "body": `<script>location.href += "/index.html"</script>` }
}

module.exports.main = main