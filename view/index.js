
window.onload = () => {
    let btnAdd = document.querySelector('#btnAdd');
    btnAdd.addEventListener('click',()=>{
        const template = document.querySelector('#tmpSql');
        //template 복제
        const fragment = template.content.cloneNode(true);
        //template의 td
        template.parentNode.appendChild(fragment);
    },false);
    
    btnGen.addEventListener('click', ()=>{
        let server = document.querySelector('#server').value;
        let database = document.querySelector('#database').value;
        let user = document.querySelector('#user').value;
        let password = document.querySelector('#password').value;
        fetch('/mssql/connect', {
            method:'POST',
            body: JSON.stringify({server,database,user,password}),
            headers:{
                'Content-type':'application/json'
            }
        }).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            return Promise.reject(response);
        }).then(function (data) {
            console.log(data);
        }).catch(function (error) {
            console.warn('Something went wrong.', error);
        });

        parse('select * from user a inner join team b on a.teamId = b.id left outer join common c on c.id = b.name');
    }, false);
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