
window.onload = () => {

    btnConnect.addEventListener('click', async () =>{
        let res = await connect();
        btnConnect.innerHTML = res.status;
    });

    btnAdd.addEventListener('click',()=>{
        const template = document.querySelector('#tmpSql');
        //template 복제
        const fragment = template.content.cloneNode(true);

        fragment.querySelector('textarea[name="txSql"]').value = `
      select * 
        from innovator.Alias a 
       inner join innovator.Identity b 
          on a.related_Id = b.id`;
          
        //template의 td
        template.parentNode.appendChild(fragment);
    },false);

    btnGen.addEventListener('click', async ()=>{
        //get sql statements
        let sqls = getSqlStatements();
        //get table names
        //get cols relation
        let tableNames = [];
        let arrowsFromQuery = [];
        for(let sql of sqls){
            let tmpRes = parse(sql);
            tableNames.push(...tmpRes.tables);
            arrowsFromQuery.push(...tmpRes.arrows);
        }
        
        let tables = [];
        let arrows = [];
        //make table object
        for(let tableName of tableNames){
            let table = await tableInfo(tableName);
            tables.push(table);
            addTableUI(table);

            let arrow = await tableWhereUsed(tableName);
            arrows.push(...arrow);
        }
        //make cols relation object
        //arrowsFromQuery 지지고 볶고


        //send to drawIo
        erd.tables = tables;
        erd.arrows = arrows;
        erd.draw();
       

    }, false);
}

function addTableUI(table){
    const template = document.querySelector('#tmpTb');
    //template 복제
    const fragment = template.content.cloneNode(true);
    fragment.querySelector('#tbName').textContent = table.name;
    fragment.querySelector('#pk').textContent = table.pk;
    fragment.querySelector('#fk').textContent = table.fk;
    fragment.querySelector('#col').textContent = table.col;
    //template의 td
    template.parentNode.appendChild(fragment);
}
function getSqlStatements(){
    let result = new Array();
    let txSqls = document.querySelectorAll('textarea[name="txSql"]');
    for(let txSql of txSqls){
        result.push(txSql.value);
    }
    return result;
}
async function tableWhereUsed(fullTable){
    let splitFullTable = fullTable.split('.');
    let name = splitFullTable[splitFullTable.length-1];
    let arrows = new Array();
    const resArrows = await getRes(`/mssql/${name}/whereUsed`);
    for(let row of resArrows){
        let arrow = {};
        arrow.FromTb = row.FromTb;
        arrow.FromCol = row.FromCol;
        arrow.ToTb = row.ToTb;
        arrow.ToCol = row.ToCol;
        arrow.type= 12;
        arrows.push(arrow);
    }

    return arrows;

}


async function tableInfo(fullTable){
    let splitFullTable = fullTable.split('.');
    let name = splitFullTable[splitFullTable.length-1];
    let table = {
        name:name,
        pk:[],
        fk:[],
        col:[]
    };

    const pkfk = await getRes(`/mssql/${name}/pkfk`);
    for(let row of pkfk){
        if(row.ColType === 'PK') table.pk.push(row.Col);
        else table.fk.push(row.Col);
    }

    const cols = await getRes(`/mssql/${name}/cols`);
    for(let row of cols){
        table.col.push(row.Col);
    }

    return table;
}

async function getRes(url){
    const res = await fetch(url, {
        method:'GET',
        headers:{
            'Content-type':'application/json'
        }
    });
    let resData = await res.json();
    return resData;
}
async function connect(){
    let result = {};
    let server = document.querySelector('#server').value;
    let database = document.querySelector('#database').value;
    let user = document.querySelector('#user').value;
    let password = document.querySelector('#password').value;
    const response = await fetch('/mssql/connect', {
        method:'POST',
        body: JSON.stringify({server,database,user,password}),
        headers:{
            'Content-type':'application/json'
        }
    });
    let data = await response.json();
    return data;
}

function parse(sql){
    let from = getStrFrom(sql);
    let tableInfo = getTableInfo(from);
    return tableInfo;
}
//table Name, related cols
//getStrFrom('select * from user group by aa order by 3')
//getStrFrom('select * from user where userId = 5 group by aa order by 3')
//getStrFrom('select * from user a inner join team b on a.teamId = b.id left outer join common c on c.id = b.name')
function getStrFrom(sql){
    sql = sql.toLowerCase();
    let idxFrom = sql.indexOf('from')+4
    let idxWhere = sql.indexOf('where');
    let idxGroupBy = sql.indexOf('group by');
    let idxOrderBy = sql.indexOf('order by');
    let strFrom = "";
    if (idxWhere >= 0)
        strFrom = sql.substring(idxFrom,idxWhere);
    else if(idxGroupBy >= 0)
        strFrom = sql.substring(idxFrom,idxGroupBy);
    else if(idxOrderBy >= 0)
        strFrom = sql.substring(idxFrom,idxOrderBy);
    else
        strFrom = sql.substring(idxFrom);
    
    return strFrom.trim();
}

function getTableInfo(from){
    let result = {
        tables:[],
        arrows:[]
    };
    let elem = ('join '+from).split(' ');
    let tbAlias = new Object();
    let cols = new Array();
    for(let i = 0; i<elem.length; i++){
        if(elem[i] == 'join'){
            tbAlias[elem[i+2]] = elem[i+1];
            result.tables.push(elem[i+1]);
        }else if(elem[i] == 'on' || elem[i] == 'and'){
            let arrow = new Object();
            let left = elem[i+1].split('.');
            let right = elem[i+3].split('.');
            arrow.FromTb = tbAlias[left[0]];
            arrow.FromCol = left[left.length-1];
            arrow.ToTb = tbAlias[right[0]]
            arrow.ToCol = right[right.length-1];
            result.arrows.push(arrow);
        }
    }
    const tableSet = new Set(result.tables);
    result.tables = [...tableSet];
    return result;
}