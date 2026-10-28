'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {attachMonitor}=require('../lib/native-monitor.cjs');
function fixture(){
  const child=new EventEmitter();child.stdin=new EventEmitter();child.stdout=new EventEmitter();
  const writes=[],failures=[],changes=[],focus=[];let kills=0;
  child.stdin.write=value=>writes.push(value);child.kill=()=>{kills++;return true;};
  const session=attachMonitor(child,{changed:value=>changes.push(value),focused:value=>focus.push(value),failed:error=>failures.push(error)});
  return {child,...session,writes,failures,changes,focus,kills:()=>kills};
}
test('unexpected exit with code zero activates fallback and rejects pending sequence reads',async()=>{
  const f=fixture();const pending=f.queries.read();
  const rejection=assert.rejects(pending,/stopped/);
  f.child.emit('exit',0);await rejection;
  assert.equal(f.failures.length,1);assert.match(f.failures[0].message,/stopped/);
  await assert.rejects(f.queries.read(),/unavailable/);
  f.child.emit('error',new Error('late error'));assert.equal(f.failures.length,1);
});
test('explicit shutdown is quiet and closes pending requests',async()=>{
  const f=fixture();const rejection=assert.rejects(f.queries.read(),/stopped/);
  assert.equal(f.child.kill(),true);f.child.emit('exit',1);await rejection;
  assert.equal(f.kills(),1);assert.deepEqual(f.failures,[]);
});
test('broken input pipe reports one failure even when the process exits afterward',()=>{
  const f=fixture();f.child.stdin.emit('error',new Error('broken pipe'));f.child.emit('exit',0);
  assert.equal(f.failures.length,1);assert.match(f.failures[0].message,/broken pipe/);
});
test('bounded fragmented responses preserve clipboard, focus and sequence events',async()=>{
  const f=fixture();const pending=f.queries.read();
  f.child.stdout.emit('data',Buffer.from('null\ninvalid\n{"sequence":7}\n{"focus":{"window":42}}\n{"clipboardQuery":'));
  f.child.stdout.emit('data',Buffer.from('1,"sequence":9}\n'));
  assert.equal(await pending,9);assert.deepEqual(f.changes,[7]);assert.deepEqual(f.focus,[{window:42}]);
  f.child.stdout.emit('data',Buffer.from('x'.repeat(64001)));
  assert.equal(f.failures.length,1);assert.equal(f.kills(),1);
  f.child.stdout.emit('data',Buffer.from('{"sequence":10}\n'));assert.deepEqual(f.changes,[7]);
});
