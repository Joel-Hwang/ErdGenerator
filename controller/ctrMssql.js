var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var sql = require('mssql');
const { route } = require('express/lib/application');
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
    
    let pool = await sql.connect(config)
    result.status = pool._connected?'Connected':'Failed';
    res.send(JSON.stringify(result));
});

router.get('/mssql/select', async function (req, res) {
    var request = new sql.Request();
    request.stream = true;
    
    let q = 'select top 10 * from innovator.[USER]';
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

router.get('/mssql/fk', async (req,res) => {
    var sqlReq = new sql.Request();
    sqlReq.stream = true;


    let q = `
select object_name(f.parent_object_id) tableName
	 , col_name(fc.parent_object_id, fc.parent_column_id) colName
	 , object_name(fc.referenced_object_id) tableName
	 , col_name(fc.referenced_object_id, fc.referenced_column_id) colName2
  from sys.foreign_keys as f
 inner join sys.foreign_key_columns as fc
    on f.object_id = fc.constraint_object_id
 inner join sys.tables t
    on t.object_id = fc.referenced_object_id
 where OBJECT_NAME(f.referenced_object_id) = 'CS_LABTEST'
    `;

    sqlReq.query(q, (err, recordset) => {
        if(err){
            return console.log('query error :',err)
        }
    });
    
    await postReq(sqlReq,res,q);

});

router.get('/mssql/cols', async (req,res) => {
    var sqlReq = new sql.Request();
    sqlReq.stream = true;


    let q = `
  select Table_Name, Column_Name, IS_NULLABLE, Data_Type,CHARACTER_MAXIMUM_LENGTH 
    from information_schema.columns where table_name = 'CS_PFC'
   order by ORDINAL_POSITION
    `;

    sqlReq.query(q, (err, recordset) => {
        if(err){
            return console.log('query error :',err)
        }
    });
    
    await postReq(sqlReq,res,q);

});

router.get('/mssql/pk', async (req,res) => {
    var sqlReq = new sql.Request();
    sqlReq.stream = true;


    let q = `
  select table_name, column_name, left(constraint_name,2) as tttype
    from information_schema.KEY_COLUMN_USAGE
   where table_name = 'CS_LABTEST'
    `;

    sqlReq.query(q, (err, recordset) => {
        if(err){
            return console.log('query error :',err)
        }
    });
    
    await postReq(sqlReq,res,q);
});





function postReq(sqlReq,res, q){
    sqlReq.query(q, (err, recordset) => {
        if(err){
            return console.log('query error :',err)
        }
    });
    
    var result = [];
    sqlReq.on('error', function(err){
        console.log(err); 
    }).on('row', (row) => {
        result.push(row)
    }).on
    ('done', () => { // 마지막에 실행되는 부분
        console.log('result :', result)
        res.send(JSON.stringify(result));
    });
}

module.exports = router;