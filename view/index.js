
window.onload = () => {
    let addBtn = document.querySelector('#btnAdd');
    addBtn.addEventListener('click',()=>{
        const template = document.querySelector('#tmpSql');
        //template 복제
        const fragment = template.content.cloneNode(true);
        //template의 td
        template.parentNode.appendChild(fragment);
    },false);
}
