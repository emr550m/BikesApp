var express=require("express");
var bodyParser = require('body-parser')
var mongoSanitize = require('express-mongo-sanitize');
var db = require("./db/mongo");
var log = require("./logger");
var sessionUtil = require("./utility/session");
var port = process.env.PORT || 1337;


var app = express();
db.OpenDB();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(mongoSanitize({ replaceWith: '_' }));



app.get("/",function(req,res){

    res.send("Hello World from My Code Test");

});

app.use(function (req, res, next) {
    var send = res.send;
    res.send = function (data) {
         log.info("Response:" + data + "\n\n");
        send.call(this, data);
    };
    log.info("Request" + JSON.stringify(req.body));
    next();
});



app.use(["/api/open", "/api/open*"], function (request, response, next) {
    var requestRedirect = require("./api/open" + request.url);

    requestRedirect(request, response).then(function (result) {
        response.json(result);
        next();
    }).catch(function (err) {
        next({ body: err, reqBody: request.body, message: "Error" });
    });
});

app.use(["/api/auth", "/api/auth*"], function (request, response, next) {

    var requestRedirect = require("./api/auth" + request.url);
    var { username, session } = request.body;
    if (username && session) {
        sessionUtil.checksession(session, username).then(function (returnValue) {


            requestRedirect(request, response).then(function (result) {
                response.json(result);
                next();
            }).catch(function (err) {
                next({ body: err, reqBody: request.body, message: "Error" });
            });
        }).catch(function (err) {
            next({ body: err, reqBody: request.body, message: "Error" });
        });
    } else {
        var result = {
            success: false,
            message: "Auth Error"
        }
        next({ body: result, reqBody: request.body, message: "Error" });
    }
})

app.use(function (err, req, res, next) {
    var result = {
        success: false,
        message: 'Api Error'
    }
    if (err.body)
        result = err.body;

    log.error("ERROR_START:");
    log.error("PATH:\t" + req.path);
    if (err.reqBody) {
        log.error("REQUEST:\n" + JSON.stringify(err.reqBody));
    }
    if (err.body) {
        log.error("RESPONSE:\n" + JSON.stringify(err.body));
    } else {
        log.error("RESPONSE:\n" + err);
    }
    log.error("TITLE:\t" + err.message);
    if (err.stack)
        log.error("STACK TRACE:\n" + err.stack);
    log.error("ERROR_END:\n\n");

    res.json(result);
})


app.listen(port);
