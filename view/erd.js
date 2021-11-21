let erd = {
    tables:[],
    arrows:[],

    draw : () => {
        iframe = document.createElement("iframe");
        iframe.setAttribute("frameborder", "0");
        window.addEventListener("message", postMessage);
        iframe.setAttribute(
            "src",
            "https://embed.diagrams.net/?&embed=1&spin=1&proto=json&configure=1&ruler=1&zoom=4"
        );
        document.body.appendChild(iframe);
    },

    generateXml : ()=> {
        let gXml = `
<mxGraphModel dx="873" dy="1125" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    {0}
  </root>
</mxGraphModel>`;
        let y = 10;
        let x = 0;
        let xml = '';
        let colCnt = parseInt(Math.sqrt(erd.tables.length));
        let count = 1;
        let maxY = 0;
        for(let table of erd.tables){
            let xmlTable = getXmlFromTable(table,x,y);
            xml += xmlTable;
            x+=300;
            
            if((count++)%colCnt==0) {
              y += maxY + 100;
              x = count*10;
              maxY = 0;
            }
            maxY = Math.max(maxY,(table.pk.length+table.fk.length +table.col.length)*30 ) ;
        }
        for(let arrow of erd.arrows){
            let xmlArrow = getXmlFromRel(arrow.FromTb,arrow.FromCol,
                arrow.ToTb,arrow.ToCol,arrow.type);
            xml += xmlArrow;
        }
        
        gXml = gXml.format(xml);
        return gXml;
    }


};

   function getXmlFromTable(table,posX,posY){
       let idx = 1;
       let y = 0;
       let header = `
    <mxCell id="{0}" value="{1}" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;strokeColor=default;" vertex="1" parent="1">
      <mxGeometry x="${posX}" y="${posY}" width="180" height="{2}" as="geometry" />
    </mxCell>`;
        let pk = `
    <mxCell id="{1}" value="" style="shape=partialRectangle;collapsible=0;dropTarget=0;pointerEvents=0;fillColor=none;top=0;left=0;bottom=1;right=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="{0}">
      <mxGeometry y="{5}" width="180" height="30" as="geometry" />
    </mxCell>
    <mxCell id="{2}" value="PK" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;fontStyle=1;overflow=hidden;" vertex="1" parent="{1}">
      <mxGeometry width="30" height="30" as="geometry">
        <mxRectangle width="30" height="30" as="alternateBounds" />
      </mxGeometry>
    </mxCell>
    <mxCell id="{3}" value="{4}" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;fontStyle=5;overflow=hidden;" vertex="1" parent="{1}">
      <mxGeometry x="30" width="150" height="30" as="geometry">
        <mxRectangle width="150" height="30" as="alternateBounds" />
      </mxGeometry>
    </mxCell>`;
        let fk = `
    <mxCell id="{1}" value="" style="shape=partialRectangle;collapsible=0;dropTarget=0;pointerEvents=0;fillColor=none;top=0;left=0;bottom=1;right=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="{0}">
      <mxGeometry y="{5}" width="180" height="30" as="geometry" />
    </mxCell>
    <mxCell id="{2}" value="FK" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;fontStyle=1;overflow=hidden;" vertex="1" parent="{1}">
      <mxGeometry width="30" height="30" as="geometry">
        <mxRectangle width="30" height="30" as="alternateBounds" />
      </mxGeometry>
    </mxCell>
    <mxCell id="{3}" value="{4}" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;fontStyle=5;overflow=hidden;" vertex="1" parent="{1}">
      <mxGeometry x="30" width="150" height="30" as="geometry">
        <mxRectangle width="150" height="30" as="alternateBounds" />
      </mxGeometry>
    </mxCell>`
        let col = `
    <mxCell id="{1}" value="" style="shape=partialRectangle;collapsible=0;dropTarget=0;pointerEvents=0;fillColor=none;top=0;left=0;bottom=0;right=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;" vertex="1" parent="{0}">
      <mxGeometry y="{5}" width="180" height="30" as="geometry" />
    </mxCell>
    <mxCell id="{2}" value="" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;editable=1;overflow=hidden;" vertex="1" parent="{1}">
      <mxGeometry width="30" height="30" as="geometry">
        <mxRectangle width="30" height="30" as="alternateBounds" />
      </mxGeometry>
    </mxCell>
    <mxCell id="{3}" value="{4}" style="shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;align=left;spacingLeft=6;overflow=hidden;" vertex="1" parent="{1}">
      <mxGeometry x="30" width="150" height="30" as="geometry">
        <mxRectangle width="150" height="30" as="alternateBounds" />
      </mxGeometry>
    </mxCell>
       `;

       let headerId = table.name+'-'+idx;
       let res = '';
       for(let i = 0; table.pk && i<table.pk.length; i++){
           let tempIdx1 = table.name+'-'+table.pk[i];//(++idx);
           let tempIdx2 = table.name+'-'+(++idx);
           let tempIdx3 = table.name+'-'+(++idx);
           res += pk.format(headerId,tempIdx1,tempIdx2,tempIdx3,table.pk[i],y+=30);
       }
       for(let i = 0; table.fk && i<table.fk.length; i++){
           let tempIdx1 = table.name+'-'+table.fk[i];//(++idx);
           let tempIdx2 = table.name+'-'+(++idx);
           let tempIdx3 = table.name+'-'+(++idx);
           res += fk.format(headerId,tempIdx1,tempIdx2,tempIdx3,table.fk[i],y+=30);
       }
       for(let i = 0; table.col && i<table.col.length; i++){
           let tempIdx1 = table.name+'-'+table.col[i];//(++idx);
           let tempIdx2 = table.name+'-'+(++idx);
           let tempIdx3 = table.name+'-'+(++idx);
           res += col.format(headerId,tempIdx1,tempIdx2,tempIdx3,table.col[i],y+=30);
       }
       return header.format(headerId,table.name,30+y)+res;
   }

   function getXmlFromRel(fromTable, fromCol, toTable, toCol, type){
     let arrow = 'endArrow=ERoneToMany;startArrow=ERmandOne';
     switch(type){
       case 11:
          arrow = 'endArrow=ERmandOne;startArrow=ERmandOne';
         break;
       case 21:
       arrow = 'endArrow=ERmandOne;startArrow=ERoneToMany';
         break;
       case 12:
       arrow = 'endArrow=ERoneToMany;startArrow=ERmandOne';
         break;
        case 22:
       arrow = 'endArrow=ERoneToMany;startArrow=ERoneToMany';
         break;
        default:
            arrow = 'endArrow=ERmandOne;startArrow=ERmandOne';
            break; 
     }
    let xml = `<mxCell id="${fromTable+'.'+fromCol}-${toTable+'.'+toCol}" value="" style="edgeStyle=orthogonalEdgeStyle;fontSize=12;html=1;${arrow};rounded=1;" edge="1" parent="1" source="${fromTable+'-'+fromCol}" target="${toTable+'-'+toCol}">
          <mxGeometry width="100" height="100" relative="1" as="geometry">
            <mxPoint x="530" y="470" as="sourcePoint" />
            <mxPoint x="630" y="370" as="targetPoint" />
          </mxGeometry>
      </mxCell>`;
    return xml;
   }

   String.prototype.format = function() {
	a = this;
	for (k in arguments) {
		a = a.replace( new RegExp("\\{"+k+"\\}" ,"gi"), arguments[k]);
	}
	return a;
}


    function postMessage(evt) {
        if (evt.data.length < 1) return;
        let msg = JSON.parse(evt.data);
        switch (msg.event) {
        case "configure":
            iframe.contentWindow.postMessage(
                JSON.stringify({
                    action: "configure",
                    config: {
                        defaultFonts: ["Humor Sans", "Helvetica", "Times New Roman"],
                    },
                }),
            "*"
            );
            break;
        case "init":
            
            iframe.contentWindow.postMessage(
                JSON.stringify({ action: "load", autosave: 1, xml: erd.generateXml() }),
                "*"
            );
            iframe.contentWindow.postMessage(
                JSON.stringify({ action: "status", modified: true }),
                "*"
            );
            break;
        case "load":
            //console.log(msg.event);
            //console.log(msg.xml);
            break;
        case "autosave":
            gXml = msg.xml;
            let xmlDoc = mxUtils.parseXml(gXml);
            let encryptedModel = xmlDoc.querySelector("diagram").textContent;

            data = atob(encryptedModel);
            data = pako.inflateRaw(
            Uint8Array.from(data, (c) => c.charCodeAt(0)),
                { to: "string" }
            );
            data = decodeURIComponent(data);

            gXml = editor.decode(encryptedModel)
            break;
        case "save":
            localStorage.error = "Save button clicked";
            editor.save(msg);
            break;
        case "exit":
            editor.close();
            break;
        case "export":
            editor.exportXml(msg);
            editor.close();
            break;
    }
    }
