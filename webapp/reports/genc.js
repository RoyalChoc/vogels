/*Genetic Calculator 
(c) 2002-2003 Martin Rasek*/

addEvent(window, "load", init);

function init(){
	var k,l,i,el;
		
	if (!document.createElement) return;
	

	el=document.getElementById("R");			/* enable on reset */
	if (el!=null)	{
		el.onclick = enableR;
		el.onmouseout = function(){
				origSetting();
				this.style.borderLeftWidth="2";
				this.style.borderRightWidth="2";
			}
		el.onmouseover = doHover;
	}

	el=document.getElementById("G");			/* set cookies */
	if (el!=null)	{
		el.onclick = setVals;
		el.onmouseover = doHover;
		el.onmouseout = undoHover;
	}

	el=document.getElementsByTagName("input");	/* Clear on double click */
	for (i=0;i<el.length;i++) {
		el[i].ondblclick = clearR;
	}
	var se="m";
	type=["d","r","s"]
	for (k=0;k<2;k++){
	  for (l=0;l<3;l++){
		i=0;
		el = document.getElementsByName(se+type[l]+"m["+i+"]");
		while(el.length!=0){
			for (j=0;j<el.length;j++) {
				el[j].onclick = setM;
				el[j].ondblclick = resetM;
			}
			i=i+2;
			el = document.getElementsByName(se+type[l]+"m["+i+"]");
		}
	  }
	  el=document.getElementsByName(se+"blD");	/* Disable and set links */
	  if (el.length!=0) {el[0].checked = true;}
	  for (i=0;i<el.length;i++) {
		el[i].disabled = true;
		el[i].ondblclick = "focus()";
	  }

	  if (document.getElementById(se+"link")!=null){   /* Check links */
		el=document.getElementById(se+"l");	
		if (el!=null)	{el.onclick = checkLink;}
		el=document.getElementById(se+"ld");	
		if (el!=null)	{el.onclick = checkLink;}
		el=document.getElementsByName(se+"rm[1]");	
		for (i=0;i<el.length;i++) {el[i].onclick = checkLink;}
		el=document.getElementById(se+"rdbls");	
		if (el!=null)	{el.onclick = checkLink;}
		el=document.getElementById(se+"rdbl");	
		if (el!=null)	{el.onclick = checkLink;}
		

		el=document.getElementById(se+"link");	/* Hide link divs */
		el.style.visibility="hidden";
	  }
	  el=document.getElementById(se+"linkt");	/* Hide link texts T1 T2*/
	  if (el!=null)	{el.style.visibility="hidden";}
	  se = "f";
	}
	getVals();		/* set values */
}

function doHover(){
	this.style.borderLeftWidth="3";
	this.style.borderRightWidth="3";
}

function undoHover(){
	this.style.borderLeftWidth="2";
	this.style.borderRightWidth="2";
}


function setM(){
	var id = this.getAttributeNode("id").value;
	var num = Number(id.charAt(4));
	var group = Number(id.charAt(3))+1;
	var type = id.charAt(1);
	var se = id.charAt(0);
	var i,el,coef;

	coef = (type=="s") ? 2:1;
	i=0;
	el=document.getElementById(se+type+"m"+group+i);
	while(el!=null){
		if((el.checked==true)&&(i>=coef*num)) el.checked = false;
		el.disabled = (i<coef*num) ? false:true;
		i++;
		el=document.getElementById(se+type+"m"+group+i);
	}
	checkLink();
}

function resetM(){
	var id = this.getAttributeNode("id").value;
	var num = Number(id.charAt(4));
	var group = Number(id.charAt(3))+1;
	var type = id.charAt(1);
	var se = id.charAt(0);
	var i,el;

	i=0;
	el=document.getElementById(se+type+"m"+group+i);
	while(el!=null){
		el.disabled = false;
		i++;
		el=document.getElementById(se+type+"m"+group+i);
	}
	this.checked = this.checked==true ? false:true;
}

function clearR(){
	this.checked = this.checked==true ? false:true;
	checkLink();
}

function enableR(){
	var el = document.getElementsByTagName("input");
	for (var i=0;i<el.length;i++) {
		el[i].disabled = false;
	}
}

function checkLink(){
	var se="m";
	var active, status;
	for (k=0;k<2;k++){
	  active=true;
	  status = "hidden";
	  el=document.getElementById(se+"l");
	  if ((el!=null)&&(el.checked==true)){
		el=document.getElementsByName(se+"rm[1]");	
		for (i=0;i<el.length;i++) {
	            var isBlue = el[i].getAttributeNode("value").value			//check allele for blue only
        	    if ((el[i].checked==true)&&(isBlue.charAt(0)=="b")) active=false;
	        }
		el=document.getElementById(se+"rdbls");
		if ((el!=null)&&(el.checked==true)) {active=false;}

	  }
	  if (!active) status="visible";
	  el=document.getElementsByName(se+"blD");	/* Disable links */
	  for (i=0;i<el.length;i++) {el[i].disabled = active;}
	  
	  el=document.getElementById(se+"link");	/* Hide links */
	  if (el!=null){el.style.visibility=status;}
	  el=document.getElementById(se+"linkt");	/* Hide link texts */
	  if (el!=null){el.style.visibility=status;}

	  se = "f";
	}
}

function origSetting(){
	checkLink();
	el=document.getElementsByName("mblD");	/* Set links */
	for (i=0;i<el.length-1;i++){el[0].checked = true;}
	el=document.getElementsByName("fblD");
	for (i=0;i<el.length-1;i++){el[0].checked = true;}

}

function setVals(){		/* store values in cookies */
	var val="";
	el=document.getElementsByTagName("input");	
	for (i=0;i<el.length;i++) {
		var att= el[i].getAttribute("type");
		if ((att!="radio")&&(att!="checkbox")) {continue;}
		if (el[i].checked==true){val=val+i+"x";}
	}
	var name;
	el = document.getElementsByTagName("form");
	if (el.length!=0) {
		name = el[0].getAttribute("action");
		name=name.substr(name.indexOf("sp=")+4);
	}
	writeC(name,val,30);
}

function getVals(){		/* get values from cookies */
	var name;
	el = document.getElementsByTagName("form");
	if (el.length!=0) {
		name = el[0].getAttribute("action");
		name=name.substr(name.indexOf("sp=")+4);
	}
	var val = readC(name);
	if (val==null){return 0;}
	el=document.getElementsByTagName("input");
	var num,idx;
	while(val!=""){
		idx = val.indexOf("x");
		num = val.substr(0,idx);
		val = val.substr(idx+1);
		num = eval(num);
		if (num<=el.length){el[num].checked=true;}
	}
	checkLink();
}

/**************************************/

function addEvent(obj, eT, fn){
  if (obj.addEventListener){
    obj.addEventListener(eT, fn, true);
    return true;
  } else if (obj.attachEvent){
	var r = obj.attachEvent("on"+eT, fn);
    return r;
  } else {
	return false;
  }
}


function writeC(name,val,days){
	exp=new Date();
	exp.setTime(exp.getTime()+(86400000*days))
	document.cookie=name+"="+escape(val)+"; expires="+exp.toGMTString()+"; path=/";
}

function readC(name){
	name=name+"=";
	len=name.length;
	cook=document.cookie
	clen=cook.length;
	from=0;
	while(from<clen){
	  upto=from+len;
	  if (cook.substring(from,upto)==name){
		endstr=cook.indexOf(";",upto);
		if (endstr==-1) endstr=cook.length;
		res=unescape(cook.substring(upto,endstr));
		return (res);
  	  }
	  from=cook.indexOf(" ",from)+1;
	  if (from==0) break;
	}
	return (null);
}