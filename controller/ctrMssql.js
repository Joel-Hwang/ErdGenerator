var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var sql = require('mssql');
var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(session({
  secret: '@#@$MYSIGN#@$#$',
  resave: false,
  saveUninitialized: true
}));


router.post('/mssql/connect', async function (req, res) {
    let result = new Object();
    let config = {
        user: req.body.user,
        password: req.body.password,
        server: req.body.server,
        database: req.body.database,
        stream: true,
        encrypt: false
    }
    
    sql.connect(config, function(err){
        if(err){
            result.result = 'Fail';
        }else
            result.result = 'Success';

        res.send(JSON.stringify(result));
    })
});

router.get('/mssql/select', async function (req, res) {
    var request = new sql.Request();
    request.stream = true;
    
    q = 'select top 10 * from innovator.[USER]';
    request.query(q, (err, recordset) => {
        if(err){
            return console.log('query error :',err)
        }
    });
    
    var result = [];
    request.on('error', function(err){
        console.log(err); 
    }).on('row', (row) => {
        result.push(row)
    }).on
    ('done', () => { // 마지막에 실행되는 부분
        console.log('result :', result)
        res.send(JSON.stringify(result));
    });
});

module.exports = router;