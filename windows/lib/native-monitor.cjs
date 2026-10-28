'use strict';
const {ClipboardSequenceQueries}=require('./clipboard-sequence.cjs');

// An unexpected successful exit is still a lost clipboard listener. Notify the
// owner once so bounded polling takes over; an explicit kill is normal shutdown.
function attachMonitor(child,{changed,failed,focused=()=>{}}){
  const queries=new ClipboardSequenceQueries(value=>child.stdin.write(value));
  const kill=child.kill.bind(child);
  let ended=false,buffer='';
  const finish=error=>{
    if(ended)return;
    ended=true;queries.close();
    if(error)failed(error);
  };
  child.kill=(...args)=>{finish();return kill(...args);};
  child.stdin.on('error',error=>finish(error));
  child.on('error',error=>finish(error));
  child.on('exit',()=>finish(new Error('Native clipboard monitor stopped.')));
  child.stdout.on('data',chunk=>{
    if(ended)return;
    buffer+=chunk.toString();
    if(buffer.length>64000){finish(new Error('Native clipboard monitor response exceeded its limit.'));kill();return;}
    let newline;
    while((newline=buffer.indexOf('\n'))>=0){
      const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);
      let value;try{value=JSON.parse(line);}catch{continue;}
      if(!value||typeof value!=='object')continue;
      if(value.clipboardQuery!==undefined)queries.receive(value);
      else if(Number.isInteger(value.sequence))changed(value.sequence);
      if(value.focus)focused(value.focus);
    }
  });
  return {child,queries};
}
module.exports={attachMonitor};
