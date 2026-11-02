const {test}=require('node:test');
const assert=require('node:assert/strict');
const {select,validate}=require('./diario.cjs');
test('não repete temas concluídos e encerra fila',()=>{
  const q=[{id:'um',tema:'Tema um'},{id:'dois',tema:'Tema dois'}];
  assert.equal(select(q,{um:{}}).id,'dois');
  assert.equal(select(q,{um:{},dois:{}}),undefined);
  assert.throws(()=>select([{id:'../segredo',tema:'x'}],{}));
  assert.throws(()=>select([...q,q[0]],{}));
});
test('rejeita roteiro excessivo e cena externa antes de comprar voz',()=>{
  const p=()=>({roteiro:{titulo:'Tema',frases:Array.from({length:12},(_,i)=>({plano:`cena_${i}`,texto:'Esta é uma frase.'}))},cena:'window.CENA={montar(){},cena(){}}',publicacao:'Legenda'});
  const pack=validate(p());
  assert.equal(pack.roteiro.voz.id,'iJ7HFMLySFb7M2U4KGy5');
  assert.equal(pack.roteiro.fps,24);
  const big=p();big.roteiro.frases[0].texto='palavra '.repeat(400);
  assert.throws(()=>validate(big));
  const ext=p();ext.cena+=';fetch("https://example.com")';assert.throws(()=>validate(ext));
});
