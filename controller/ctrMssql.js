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
    
    try{
        let pool = await sql.connect(config)
        result.status = pool._connected?'Connected':'Failed';
        res.send(JSON.stringify(result));
        console.log(pool);
    }catch(e){
        console.log(e);
        result.status =e.message;
        res.send(JSON.stringify(result));
    }
    
});

router.get('/mssql/:table/whereUsed', async (req,res) => {

    let q = `
select object_name(fc.referenced_object_id) FromTb
	 , col_name(fc.referenced_object_id, fc.referenced_column_id) FromCol
     , object_name(f.parent_object_id) ToTb
	 , col_name(fc.parent_object_id, fc.parent_column_id) ToCol
  from sys.foreign_keys as f
 inner join sys.foreign_key_columns as fc
    on f.object_id = fc.constraint_object_id
 inner join sys.tables t
    on t.object_id = fc.referenced_object_id
 where OBJECT_NAME(f.referenced_object_id) = '${req.params.table}'
    `;

    await postReq(res,q);

});

router.get('/mssql/:table/cols', async (req,res) => {
    let q = `
    select Table_Name AS Tb
         , Column_Name AS Col
      -- , 'Col' AS ColType
      -- , IS_NULLABLE AS IsNull
      -- , Data_Type AS DataType
      -- , CHARACTER_MAXIMUM_LENGTH AS Len 
      from information_schema.columns where table_name = '${req.params.table}'
    EXCEPT
    SELECT TABLE_NAME AS Tb
         , COLUMN_NAME AS Col
      -- , 'Col' AS ColType
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_NAME = '${req.params.table}'
       AND LEFT(CONSTRAINT_NAME,2) IN ('PK','FK')
    `;
    await postReq(res,q);
});

router.get('/mssql/:table/pkfk', async (req,res) => {

    let q = `
    SELECT TABLE_NAME AS Tb
         , COLUMN_NAME AS Col
         , LEFT(CONSTRAINT_NAME,2) AS ColType
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_NAME = '${req.params.table}'
       AND LEFT(CONSTRAINT_NAME,2) IN ('PK','FK')
    `;
    await postReq(res,q);
});

async function postReq(res, q){
    var sqlReq = new sql.Request();
    sqlReq.stream = true;

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
        res.send(JSON.stringify(result));
    });
}

module.exports = router;