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
select UPPER(object_name(fc.referenced_object_id)) FromTb
	 , UPPER(col_name(fc.referenced_object_id, fc.referenced_column_id)) FromCol
     , UPPER(object_name(f.parent_object_id)) ToTb
	 , UPPER(col_name(fc.parent_object_id, fc.parent_column_id)) ToCol
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
    select UPPER(Table_Name) AS Tb
         , UPPER( Column_Name ) AS Col
      -- , 'Col' AS ColType
      -- , IS_NULLABLE AS IsNull
      -- , Data_Type AS DataType
      -- , CHARACTER_MAXIMUM_LENGTH AS Len 
      from information_schema.columns 
     where table_name = '${req.params.table}'
       and Column_Name NOT IN('SORT_ORDER','PERMISSION_ID','OWNED_BY_ID','NOT_LOCKABLE','NEW_VERSION','MODIFIED_ON','MODIFIED_BY_ID','MINOR_REV','MANAGED_BY_ID','MAJOR_REV','LOCKED_BY_ID','LABEL','KEYED_NAME','IS_RELEASED','IS_CURRENT','GENERATION','CURRENT_STATE','CSS','CREATED_ON','CREATED_BY_ID','CONFIG_ID','CLASSIFICATION','BEHAVIOR')
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
    SELECT UPPER(TABLE_NAME) AS Tb
         , UPPER( Column_Name ) AS Col
         , UPPER(LEFT(CONSTRAINT_NAME,2)) AS ColType
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_NAME = '${req.params.table}'
       AND LEFT(CONSTRAINT_NAME,2) IN ('PK','FK')
    `;
    await postReq(res,q);
});

router.get('/mssql/:FromTb/:FromCol/:ToTb/:ToCol', async (req, res) => {
    let q = `
    SELECT DISTINCT TOP 1 (SELECT COUNT(*) 
                             FROM ${req.params.ToTb} B 
                            WHERE B.${req.params.ToCol} = A.${req.params.FromCol}) AS Cnt
      FROM ${req.params.FromTb} A
     ORDER BY CNT DESC
    `;
    /*let q = `
    SELECT A.${req.params.ToCol} AS 'From' ,COUNT(*) AS 'To'
      FROM ${req.params.FromTb} A
     INNER JOIN ${req.params.ToTb} B
        ON A.${req.params.FromCol} = B.${req.params.ToCol}
     WHERE A.${req.params.FromCol} IN (SELECT TOP 100 C.${req.params.FromCol} 
                                         FROM ${req.params.FromTb} C )
     GROUP BY A.${req.params.ToCol}
    HAVING COUNT(*)>1
    `;*/
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