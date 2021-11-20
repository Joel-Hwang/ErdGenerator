
window.onload = () => {

    btnConnect.addEventListener('click', async () =>{
        let res = await connect();
        btnConnect.innerHTML = res.status;
    });

    btnAdd.addEventListener('click',()=>{
        const template = document.querySelector('#tmpSql');
        //template 복제
        const fragment = template.content.cloneNode(true);
        //template의 td
        template.parentNode.appendChild(fragment);
    },false);
    
    btnGen.addEventListener('click', async ()=>{
        parse(`
        select * 
          from user a 
         inner join team b 
            on a.teamId = b.id 
          left outer join common c 
            on c.id = b.name
        `);

        let tbUser = await tableInfo('User');
        console.log(tbUser);
        let tbIdentity = await tableInfo('Identity');
        console.log(tbIdentity);
        let tbAlias = await tableInfo('Alias');
        console.log(tbAlias);
        let userArrows = await tableWhereUsed('User');
        console.log(userArrows);
    }, false);
}
async function tableWhereUsed(name){
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


async function tableInfo(name){
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
    let elem = ('join '+from).split(' ');
    let tables = new Object();
    let cols = new Array();
    for(let i = 0; i<elem.length; i++){
        if(elem[i] == 'join'){
            tables[elem[i+2]] = elem[i+1];
        }else if(elem[i] == 'on' || elem[i] == 'and'){
            let col = new Object();
            let left = elem[i+1].split('.');
            let right = elem[i+3].split('.');
            col.left = tables[left[0]]+'.'+left[1];
            col.right = tables[right[0]]+'.'+right[1];
            cols.push(col);
        }
    }
    return [tables,cols];
}