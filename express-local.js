var express = require('express');
var session = require('express-session');
var app = express();
var cors = require('cors');
var fs = require('fs');
const http = require('http').createServer(app);


app.locals.pretty = true;
app.use(cors());
app.use(express.static('view'));

app.use('/', require('./controller/ctrCommon'));


app.use(
    session({
        secret: '@#@$MYSIGN#@$#$',
        resave: false,
        saveUninitialized: true,
    })
);

app.get('/', function (req, res) {
    res.writeHead(200);
    res.end(fs.readFileSync(__dirname + '/view/index.html'));
});


http.listen(9000, async function () {
    
  console.log('9000 connected');
});