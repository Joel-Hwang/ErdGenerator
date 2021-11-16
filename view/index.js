
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
    for(let i = 0; i<elem.length; i++){
        if(elem[i] == 'join'){
            console.log('TABLE',elem[i+1]);
            console.log('ALIAS',elem[i+2]);
        }else if(elem[i] == 'on' || elem[i] == 'and'){
            console.log('cols',elem[i+1],elem[i+3]);
        }
    }
}