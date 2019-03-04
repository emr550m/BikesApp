var express=require("express");

var app = express();


app.get("/",function(req,res){

    res.send("Hello World from My Code");

});


app.listen(process.ENV.port );